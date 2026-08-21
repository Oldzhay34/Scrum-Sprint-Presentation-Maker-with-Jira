package com.aksa.capacityplanner.jiraintegration.port;

import java.util.List;
import java.util.Map;

/**
 * Jira REST API'sinden is kalemlerini cekmek icin cikis portu.
 * Su an icin gercek bir Jira baglantisi yok; NoOpJiraGatewayAdapter bos liste doner.
 * Ileride bu port'u implemente eden gercek bir JiraRestClientAdapter eklenerek
 * (jira alanlarinin proje/takima gore degisebilmesi nedeniyle) esnek bir
 * field-mapping katmani ile capacity.WorkItem'a donusum yapilacak.
 */
public interface JiraGatewayPort {

    List<JiraIssueSnapshot> fetchIssues(JiraFetchQuery query);

    /**
     * Verilen issue key'leri (genelde Epic'ler) icin SADECE Sektor alanini
     * (customfield_10498) getirir - bazi takimlarda (DA/DSYS/YZ, bkz. referans
     * "Jira Dashboard" projesinin boardConfig.js/jiraClient.js dosyalari) bu
     * alan Gorev/Alt Gorev seviyesinde degil, bagli Epic'te dolu. Donen map
     * issue key -> sektor degeri (alan bos/issue yoksa key hic yer almaz).
     */
    Map<String, String> fetchSectorByIssueKeys(List<String> issueKeys);

    /**
     * Verilen issue key'leri (genelde Epic'ler) icin Labels alanini getirir -
     * bir Epic'in KENDI takim adiyla etiketlenmis olmasi (orn. RPA-2206 "RPA"
     * label'i), o Epic'in idari/toplanti isi oldugunu (gercek teslim edilen
     * is degil) gosterir - bkz. jiraContentMapper.js, kullanici teyidi
     * 2026-08-20. Birden fazla label varsa virgulle birlestirilir. Donen map
     * issue key -> virgulle ayrilmis label listesi (label yoksa/issue yoksa
     * key hic yer almaz).
     */
    Map<String, String> fetchLabelsByIssueKeys(List<String> issueKeys);

    record JiraFetchQuery(String jiraProjectKey, String jql) {
    }

    /**
     * Jira'dan donen ham alanlarin genel amacli tasiyicisi. Takima gore degisen
     * custom field'lar fieldValues icinde jira field id -> deger olarak tutulur;
     * WorkItem'a donusum usecase katmaninda takima ozgu mapping ile yapilir.
     */
    record JiraIssueSnapshot(String issueKey, String summary, String statusName,
                              java.util.Map<String, Object> fieldValues) {
    }
}
