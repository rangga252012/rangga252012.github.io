const noteList = document.getElementById("noteList");
const contextMenu = document.getElementById("contextMenu");
const toggleBtn = document.getElementById("toggleTheme");

let notes = [
  { id: 1, title: "contoh 1", date: "14:54" },
  { id: 2, title: "contoh 2", date: "14:54" },
  { id: 3, title: "contoh 3", date: "14:55" },
  { id: 4, title: "12341234", date: "6 Juli" },
];
let currentId = null;

function renderNotes() {
  noteList.innerHTML = "";
  notes.forEach(note => {
    const el = document.createElement("div");
    el.className = "note";
    el.innerHTML = `<strong>${note.title}</strong><br/><small>${note.date}</small>`;
    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      currentId = note.id;
      contextMenu.style.top = `${e.pageY}px`;
      contextMenu.style.left = `${e.pageX}px`;
      contextMenu.classList.remove("hidden");
    });
    noteList.appendChild(el);
  });
}

function handleAction(action) {
  const idx = notes.findIndex(n => n.id === currentId);
  if (idx === -1) return;
  if (action === "delete") {
    notes.splice(idx, 1);
  } else if (action === "edit") {
    const newTitle = prompt("Edit Judul:", notes[idx].title);
    if (newTitle) notes[idx].title = newTitle;
  } else if (action === "share") {
    alert("Fitur bagikan belum tersedia.");
  }
  contextMenu.classList.add("hidden");
  renderNotes();
}

toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  toggleBtn.innerText = document.body.classList.contains("dark") ? "Mode Terang" : "Mode Gelap";
});

document.body.addEventListener("click", () => {
  contextMenu.classList.add("hidden");
});

renderNotes();
