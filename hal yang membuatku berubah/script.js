// Fungsi untuk menambahkan foto ke galeri
function tambahFoto(url, judul, deskripsi) {
  galleryData.push({
    img: url,
    title: judul,
    desc: deskripsi
  });
  // Render ulang galeri
  const card = document.createElement('div');
  card.className = 'card';

  // Nomor urut
  const num = document.createElement('span');
  num.className = 'card-num';
  num.textContent = galleryData.length;

  // Gambar
  const img = document.createElement('img');
  img.src = url;
  img.alt = judul;
  img.className = 'card-img';

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';

  // Info
  const info = document.createElement('div');
  info.className = 'card-info';
  const titleDiv = document.createElement('div');
  titleDiv.className = 'card-title';
  titleDiv.textContent = judul;
  const descDiv = document.createElement('div');
  descDiv.className = 'card-desc';
  descDiv.textContent = deskripsi;
  info.appendChild(titleDiv);
  info.appendChild(descDiv);

  // Button
  const btn = document.createElement('button');
  btn.className = 'card-btn';
  btn.textContent = 'Lihat Detail';
  btn.onclick = () => openModal(url, `${judul}<br><br>${deskripsi}`);

  body.appendChild(info);
  body.appendChild(btn);

  card.appendChild(num);
  card.appendChild(img);
  card.appendChild(body);

  gallery.appendChild(card);
}
