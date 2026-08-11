package com.aksa.capacityplanner.jiraintegration.domain;

/**
 * jiraRestClient uzerinden Jira'daki veriyi DEGISTIREBILECEK bir istek
 * denendiginde firlatilir.
 *
 * Bu entegrasyonun tasarim kurali: Jira'daki hicbir veri (issue, worklog,
 * field, vb.) bu uygulama tarafindan YAZILMAZ/DEGISTIRILMEZ/SILINMEZ - sadece
 * okunur. Bu, "sadece GET" ile ayni sey DEGIL: Jira'nin kendi arama API'si
 * (POST /rest/api/3/search/jql, POST /rest/api/3/search/approximate-count,
 * POST /rest/api/3/issue/bulkfetch, POST /rest/api/3/worklog/list) sorgu
 * govdesi bu Body'de tasindigi icin BILEREK POST kullanir ama veri DEGISTIRMEZ
 * - bu yuzden bu istekler izinli listede (bkz. JiraRestClientConfig.
 * READ_ONLY_POST_PATH_SUFFIXES). PUT/PATCH/DELETE ise Jira'da HER ZAMAN bir
 * yazma/silme anlamina geldigi icin kosulsuz engellenir; izinli listede
 * OLMAYAN herhangi bir POST (orn. issue olusturma/POST /rest/api/3/issue) de
 * ayni sekilde engellenir. Bu kural sadece bir yorum/sozlesme degil;
 * JiraRestClientConfig'teki requestInterceptor TUM jiraRestClient
 * cagrilarinda bunu Jira'ya ULASMADAN, transport seviyesinde zorunlu kilar -
 * ileride bir gelistirici (veya bir prompt injection sonucu uretilen kod)
 * yanlislikla Jira'ya yazma istegi eklerse, uygulama calisma zamaninda HEMEN
 * ve acik bir hata ile durur.
 */
public class JiraReadOnlyViolationException extends RuntimeException {

    public JiraReadOnlyViolationException(String method, String uri) {
        super("Jira entegrasyonu salt-okunurdur, bu istek Jira'da veri degistirebilir ve engellendi: " + method + " " + uri);
    }
}
