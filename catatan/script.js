const noteForm = document.getElementById('noteForm');
const notesDiv = document.getElementById('notes');

function loadNotes() {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  notesDiv.innerHTML = '';
  notes.reverse().forEach((note, idx) => {
    const el = document.createElement('div');
    el.className = 'note-card';
    el.innerHTML = `
      <button class="remove-btn" onclick="removeNote(${notes.length-1-idx})">Hapus</button>
      <h3>${note.name}</h3>
      <p>${note.text.replace(/\n/g, '<br>')}</p>
      ${note.link ? `<a href="${note.link}" target="_blank">🔗 Link Terkait</a><br>` : ''}
      ${note.photo ? `<img src="${note.photo}" alt="Foto Catatan">` : ''}
      ${note.video ? `<video controls src="${note.video}"></video>` : ''}
      <small>${note.date}</small>
    `;
    notesDiv.appendChild(el);
  });
}

window.removeNote = function(idx) {
  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  notes.splice(idx, 1);
  localStorage.setItem('notes', JSON.stringify(notes));
  loadNotes();
};

noteForm.onsubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById('name').value;
  const text = document.getElementById('note').value;
  const link = document.getElementById('link').value;
  const photoFile = document.getElementById('photo').files[0];
  const videoFile = document.getElementById('video').files[0];

  let photo = '';
  let video = '';
  if (photoFile) {
    photo = await fileToDataUrl(photoFile);
  }
  if (videoFile) {
    video = await fileToDataUrl(videoFile);
  }

  const note = {
    name,
    text,
    link,
    photo,
    video,
    date: new Date().toLocaleString()
  };

  const notes = JSON.parse(localStorage.getItem('notes') || '[]');
  notes.push(note);
  localStorage.setItem('notes', JSON.stringify(notes));
  noteForm.reset();
  loadNotes();
};

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
}

loadNotes();
