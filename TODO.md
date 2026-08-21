# Yapılacaklar

## Kullanılabilir Kapasite (target_work_days) — izin takvimi API'sini bekliyor

**Durum:** Beklemede — izin takvimi API'si bağlanacak.

**Sorun:** Dashboard'daki "Kullanılabilir Kapasite" kolonu Jira'dan gelmiyor;
`team_members.target_work_days` alanından hesaplanıyor
(`CapacityCalculationService.calculateMemberMetrics`,
`netCapacity = targetWorkDays − geçenİşGünü − onaylıİzin`).//
Bu alan şu an serbest metin, elle giriliyor ve neredeyse hiç dolu değil:

- Ürün Geliştirme Ekibi (8 kişi): 0/8 dolu
- RPA Ekibi (8 kişi): 2/8 dolu (Atakan, Şevket — 145 gün)

Sonuç: bu iki takım dışındaki/kalan herkes için "Kullanılabilir Kapasite" hep 0
görünüyor.

**Onaylı izin düşme kısmı zaten hazır:** `LeaveService.calculateApprovedLeaveDays`
formülde zaten kullanılıyor (`leave` modülü) — şu an dış bir API'ye değil,
uygulama içindeki manuel izin kayıtlarına (`LeavePeriod`) dayanıyor.

**Yapılacak:**
1. İzin takvimi API'si bağlanınca, `target_work_days` her kişi için **aynı
   kuraldan** (henüz netleşmedi — aday: dönem içindeki toplam iş günü,
   `periodStart`–`periodEnd` arası hafta içi gün sayısı, resmi tatiller hariç)
   otomatik hesaplanacak şekilde güncellenmeli; kişiye özel durumlar (yarı
   zamanlı vb.) için manuel override imkânı korunmalı.
2. İzin takvimi API'si bağlandığında, `LeaveService`'in kaynağı (şu anki
   manuel `LeavePeriod` kayıtları yerine) o API'den beslenecek şekilde
   güncellenmeli.
3. Netleşince: hedef iş günü kuralı için kullanıcıyla tekrar teyit edilmeli
   (bkz. 2026-08-17 konuşması — henüz karar verilmedi).

**Referans dosyalar:**
- [`CapacityCalculationService.java`](src/main/java/com/aksa/capacityplanner/capacity/domain/CapacityCalculationService.java)
- [`LeaveService.java`](src/main/java/com/aksa/capacityplanner/leave/usecase/LeaveService.java)
- [`TeamMemberController.java`](src/main/java/com/aksa/capacityplanner/team/api/TeamMemberController.java) — `target_work_days` şu an buradan (veya "Manuel Gir" ekranından) elle giriliyor.
