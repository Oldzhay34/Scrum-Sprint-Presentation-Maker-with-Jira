import java.sql.*;
import java.util.*;

/**
 * Bir kerelik yerel veri tasima araci: eski MSSQL container'indaki gercek
 * satirlari, yeni Postgres schema'sina (Flyway ile onceden olusturulmus,
 * bos) JDBC uzerinden dogrudan kopyalar. CSV round-trip YOK - bu sayede
 * JSON icerikli (virgul/tirnak/newline barindiran) kolonlarda (ornegin
 * sprint_presentations.content) escaping sorunu yasanmaz.
 *
 * Kullanim: scripts/migrate-local-mssql-to-postgres.ps1 tarafindan cagirilir,
 * dogrudan calistirilmaz.
 */
public class Migrate {

    // FK + CHECK constraint bagimliliklarina gore guvenli sira: status_options,
    // team_members/work_items'daki status_code CHECK constraint'i (V8) icin
    // team_members/work_items'dan ONCE dolu olmali.
    static final String[] TABLES = {
        "teams",
        "status_options",
        "team_custom_field_definitions",
        "team_members",
        "leave_periods",
        "work_items",
        "team_member_custom_field_values",
        "sprint_presentations",
        "sprint_presentation_versions",
        "presentation_download_logs",
        "presentation_download_log_teams",
        "document",
        "document_version",
        "audit_log"
    };

    static final Set<String> HAS_IDENTITY = new HashSet<>(Arrays.asList(
        "teams", "status_options", "team_custom_field_definitions", "team_members",
        "leave_periods", "work_items", "sprint_presentations",
        "sprint_presentation_versions", "presentation_download_logs",
        "document", "document_version", "audit_log"
    ));

    public static void main(String[] args) throws Exception {
        String mssqlUrl = args[0], mssqlUser = args[1], mssqlPass = args[2];
        String pgUrl = args[3], pgUser = args[4], pgPass = args[5];

        Map<String, Long> sourceCounts = new LinkedHashMap<>();
        Map<String, Long> targetCounts = new LinkedHashMap<>();

        try (Connection src = DriverManager.getConnection(mssqlUrl, mssqlUser, mssqlPass);
             Connection dst = DriverManager.getConnection(pgUrl, pgUser, pgPass)) {
            dst.setAutoCommit(false);
            for (String table : TABLES) {
                long copied = copyTable(src, dst, table, HAS_IDENTITY.contains(table));
                targetCounts.put(table, copied);
                sourceCounts.put(table, countRows(src, table));
            }
            for (String table : TABLES) {
                if (HAS_IDENTITY.contains(table)) resetSequence(dst, table);
            }
            dst.commit();
        }

        System.out.println();
        System.out.println("=== Satir sayisi karsilastirmasi (MSSQL kaynak vs Postgres hedef) ===");
        boolean allMatch = true;
        for (String table : TABLES) {
            long s = sourceCounts.get(table), t = targetCounts.get(table);
            String status = s == t ? "OK" : "UYUSMUYOR!";
            if (s != t) allMatch = false;
            System.out.printf("%-40s kaynak=%-6d hedef=%-6d %s%n", table, s, t, status);
        }
        System.out.println();
        System.out.println(allMatch ? "Tum tablolar eslesti - tasima basarili." : "UYARI: bazi tablolarda satir sayisi eslesmiyor, yukarida kontrol edin.");
    }

    static long copyTable(Connection src, Connection dst, String table, boolean hasIdentity) throws SQLException {
        try (Statement srcStmt = src.createStatement();
             ResultSet rs = srcStmt.executeQuery("SELECT * FROM " + table)) {
            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();
            List<String> cols = new ArrayList<>();
            for (int i = 1; i <= colCount; i++) cols.add(meta.getColumnName(i));

            StringBuilder sql = new StringBuilder("INSERT INTO ").append(table).append(" (");
            sql.append(String.join(", ", cols)).append(") ");
            if (hasIdentity) sql.append("OVERRIDING SYSTEM VALUE ");
            sql.append("VALUES (");
            for (int i = 0; i < colCount; i++) sql.append(i == 0 ? "?" : ", ?");
            sql.append(")");

            long copied = 0;
            try (PreparedStatement ps = dst.prepareStatement(sql.toString())) {
                while (rs.next()) {
                    for (int i = 1; i <= colCount; i++) {
                        Object val = rs.getObject(i);
                        if (val instanceof microsoft.sql.DateTimeOffset dto) {
                            val = dto.getOffsetDateTime();
                        }
                        // content kolonlari Postgres'te jsonb - duz String binding
                        // "column is of type jsonb but expression is of type character varying"
                        // hatasi verir, PGobject ile acik tip bilgisi verilmesi gerekir.
                        if ("content".equals(cols.get(i - 1)) && val instanceof String s) {
                            org.postgresql.util.PGobject json = new org.postgresql.util.PGobject();
                            json.setType("jsonb");
                            json.setValue(s);
                            val = json;
                        }
                        ps.setObject(i, val);
                    }
                    ps.addBatch();
                    copied++;
                    if (copied % 500 == 0) ps.executeBatch();
                }
                ps.executeBatch();
            }
            System.out.println(table + ": " + copied + " satir tasindi.");
            return copied;
        }
    }

    static long countRows(Connection conn, String table) throws SQLException {
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM " + table)) {
            rs.next();
            return rs.getLong(1);
        }
    }

    static void resetSequence(Connection dst, String table) throws SQLException {
        try (Statement st = dst.createStatement()) {
            st.execute(
                "SELECT setval(pg_get_serial_sequence('" + table + "', 'id'), " +
                "COALESCE((SELECT MAX(id) FROM " + table + "), 0) + 1, false)"
            );
        }
    }
}
