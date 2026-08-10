import java.sql.*;
import java.util.*;

/**
 * Yerel Postgres'teki (Migrate.java ile MSSQL'den zaten tasinmis) gercek
 * veriyi, Railway'deki managed Postgres'e JDBC uzerinden kopyalar. Postgres
 * -> Postgres oldugu icin tip donusumu (DateTimeOffset vb.) gerekmez.
 */
public class PushToRailway {

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
        String srcUrl = args[0], srcUser = args[1], srcPass = args[2];
        String dstUrl = args[3], dstUser = args[4], dstPass = args[5];

        Map<String, Long> sourceCounts = new LinkedHashMap<>();
        Map<String, Long> targetCounts = new LinkedHashMap<>();

        try (Connection src = DriverManager.getConnection(srcUrl, srcUser, srcPass);
             Connection dst = DriverManager.getConnection(dstUrl, dstUser, dstPass)) {
            dst.setAutoCommit(false);

            try (Statement st = dst.createStatement()) {
                StringBuilder truncate = new StringBuilder("TRUNCATE TABLE ");
                for (int i = 0; i < TABLES.length; i++) truncate.append(i == 0 ? "" : ", ").append(TABLES[i]);
                truncate.append(" RESTART IDENTITY CASCADE");
                st.execute(truncate.toString());
            }

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
        System.out.println("=== Satir sayisi karsilastirmasi (yerel Postgres vs Railway Postgres) ===");
        boolean allMatch = true;
        for (String table : TABLES) {
            long s = sourceCounts.get(table), t = targetCounts.get(table);
            String status = s == t ? "OK" : "UYUSMUYOR!";
            if (s != t) allMatch = false;
            System.out.printf("%-40s kaynak=%-6d hedef=%-6d %s%n", table, s, t, status);
        }
        System.out.println();
        System.out.println(allMatch ? "Tum tablolar eslesti - Railway'e yukleme basarili." : "UYARI: bazi tablolarda satir sayisi eslesmiyor.");
    }

    static long copyTable(Connection src, Connection dst, String table, boolean hasIdentity) throws SQLException {
        try (Statement srcStmt = src.createStatement();
             ResultSet rs = srcStmt.executeQuery("SELECT * FROM " + table)) {
            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();
            List<String> cols = new ArrayList<>();
            List<String> typeNames = new ArrayList<>();
            for (int i = 1; i <= colCount; i++) {
                cols.add(meta.getColumnName(i));
                typeNames.add(meta.getColumnTypeName(i));
            }

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
                        if ("jsonb".equals(typeNames.get(i - 1)) && val != null) {
                            org.postgresql.util.PGobject json = new org.postgresql.util.PGobject();
                            json.setType("jsonb");
                            json.setValue(val.toString());
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
