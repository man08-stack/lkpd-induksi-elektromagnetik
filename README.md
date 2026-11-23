# LKPD Digital Interaktif — Dinamo Engkol

LKPD Digital Interaktif berbahasa Indonesia untuk pembelajaran Fisika Kelas XII tentang **induksi elektromagnetik pada dinamo engkol tangan**.

## Fitur

- Simulasi dinamo engkol dan medan magnet pada HTML5 Canvas.
- Grafik fluks magnetik dan GGL induksi secara real-time.
- Pengaturan jumlah lilitan, medan magnet, luas kumparan, dan kecepatan sudut.
- Perbandingan komutator DC berdenyut dan cincin geser AC.
- Lembar kerja identitas, eksperimen, HOTS, dan kesimpulan.
- Penyimpanan otomatis menggunakan `localStorage`.
- Ekspor laporan sebagai berkas HTML yang dapat dicetak/disimpan sebagai PDF.
- Manifest PWA dan service worker untuk penggunaan berulang secara offline.
- Struktur siap dikembangkan menjadi aplikasi Android dengan Capacitor.

## Menjalankan secara lokal

Persyaratan: Node.js 20 atau lebih baru.

```bash
npm install
npm run dev
```

Buka alamat yang ditampilkan Vite, umumnya `http://localhost:5173`.

Untuk pemeriksaan build:

```bash
npm run typecheck
npm run build
npm run preview
```

## Deployment GitHub Pages

Repository ini sudah menggunakan `base: './'` pada konfigurasi Vite sehingga aset dapat dimuat dari subpath GitHub Pages.

Workflow GitHub Actions di `.github/workflows/main.yml` secara otomatis:

1. Menginstal dependensi.
2. Menjalankan `npm run build`.
3. Mengunggah folder `dist`.
4. Men-deploy ke GitHub Pages.

Aktivasi sekali:

1. Buka **Settings → Pages** pada repository.
2. Pada **Build and deployment → Source**, pilih **GitHub Actions**.
3. Push perubahan ke branch `main` atau jalankan workflow secara manual.
4. Akses URL yang ditampilkan pada environment **github-pages**.

## Model fisika

Untuk kumparan yang berputar pada sudut θ:

- Φ = N × B × A × cos θ
- ε = −N × dΦ/dt
- εmaks = N × B × A × ω

Model ini bersifat ideal dan belum memasukkan rugi resistansi, induktansi, gesekan poros, atau rugi mekanis.

Pilihan **komutator** membalik setengah siklus tegangan negatif sehingga menghasilkan bentuk DC berdenyut. Pilihan **cincin geser** mempertahankan perubahan polaritas sehingga menghasilkan tegangan AC bolak-balik.

## Persiapan Capacitor Android

```bash
npm install
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "LKPD Dinamo" id.edu.lkpd.dynamo --web-dir dist
npx cap add android
npx cap sync android
npx cap open android
```

Aplikasi web harus dibangun ulang setelah perubahan kode. Lalu jalankan sinkronisasi Android dengan:

```bash
npm run build
npx cap sync android
```

Hook di `src/services/nativeBridge.ts` telah diisolasi agar UI tetap berfungsi di browser maupun WebView Android.

## Struktur sumber utama

```text
src/
├── core/physicsEngine.ts
├── services/
│   ├── storageService.ts
│   ├── exportService.ts
│   └── nativeBridge.ts
├── components/
│   ├── SimulationCanvas.tsx
│   ├── LiveCharts.tsx
│   ├── ControlPanel.tsx
│   └── WorksheetTabs.tsx
├── types/lkpd.ts
├── App.tsx
├── index.css
└── main.tsx
```

## Lisensi

MIT License.
