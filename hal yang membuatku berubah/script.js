// Data gambar, F-1 ... F-10, keterangan "belum terisi"
const galleryData = [
  {
    img: "F-1.jpg",
    title: "F-1",
    desc: "belum terisi"
  },
  {
    img: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=400&q=80",
    title: "F-2",
    desc: "belum terisi"
  },
  {
    img: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=400&q=80",
    title: "F-3",
    desc: "belum terisi"
  },
  {
    img: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=400&q=80",
    title: "F-4",
    desc: "belum terisi"
  },
  {
    img: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=400&q=80",
    title: "F-5",
    desc: "belum terisi"
  },
  {
    img: "https://images.unsplash.com/photo-1444065381814-865dc9da92c0?auto=format&fit=crop&w=400&q=80",
    title: "F-6",
    desc: "belum terisi"
  },
  {
    img: "https://images.unsplash.com/photo-1465101178521-c1a8f7a55c3c?auto=format&fit=crop&w=400&q=80",
    title: "F-7",
    desc: "belum terisi"
  },
  {
    img: "https://images.unsplash.com/photo-1424746219973-8fe3bd07d8e9?auto=format&fit=crop&w=400&q=80",
    title: "F-8",
    desc: "belum terisi"
  },
  {
    img: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=400&q=80",
    title: "F-9",
    desc: "belum terisi"
  },
  {
    img: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80",
    title: "F-10",
    desc: "belum terisi"
  }
];

const gallery = document.getElementById('gallery');

// Render Gallery
galleryData.forEach((data, idx) => {
  const card = document.createElement('div');
  card.className = 'card';

  // Nomor urut
  const num = document.createElement('span');
  num.className = 'card-num';
  num.textContent = idx + 1;

  // Gambar
  const img = document.createElement('img');
  img.src = data.img;
  img.alt = data.title;
  img.className = 'card-img';

  // Body
  const body = document.createElement('div');
  body.className = 'card-body';

  // Info
  const info = document.createElement('div');
  info.className = 'card-info';
  const title = document.createElement('div');
  title.className = 'card-title';
  title.textContent = data.title;
  const desc = document.createElement('div');
  desc.className = 'card-desc';
  desc.textContent = data.desc;
  info.appendChild(title);
  info.appendChild(desc);

  // Button
  const btn = document.createElement('button');
  btn.className = 'card-btn';
  btn.textContent = 'Lihat Detail';
  btn.onclick = () => openModal(data.img, `${title.textContent}<br><br>${desc.textContent}`);

  body.appendChild(info);
  body.appendChild(btn);

  card.appendChild(num);
  card.appendChild(img);
  card.appendChild(body);

  gallery.appendChild(card);
});

// Modal logic
const modal = document.getElementById('modal');
const modalImg = document.getElementById('modal-img');
const modalDesc = document.getElementById('modal-desc');
const closeModalBtn = document.getElementById('closeModal');

function openModal(imgSrc, descHtml) {
  modal.style.display = 'flex';
  modalImg.src = imgSrc;
  modalDesc.innerHTML = descHtml;
}

closeModalBtn.onclick = function() {
  modal.style.display = 'none';
};

window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = 'none';
  }
};
