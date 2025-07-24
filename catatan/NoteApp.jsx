import React, { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NoteApp() {
  const [notes, setNotes] = useState([
    { id: 1, title: "contoh 1", date: "14:54" },
    { id: 2, title: "contoh 2", date: "14:54" },
    { id: 3, title: "contoh 3", date: "14:55" },
    { id: 4, title: "12341234", date: "6 Juli" },
  ]);
  const [theme, setTheme] = useState("dark");
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, noteId: null });

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    document.documentElement.classList.toggle("dark");
  };

  const handleContextMenu = (e, id) => {
    e.preventDefault();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, noteId: id });
  };

  const handleAction = (action) => {
    const id = contextMenu.noteId;
    if (action === "delete") {
      setNotes(notes.filter(note => note.id !== id));
    } else if (action === "edit") {
      const newTitle = prompt("Edit Judul:");
      if (newTitle) {
        setNotes(notes.map(note => (note.id === id ? { ...note, title: newTitle } : note)));
      }
    } else if (action === "share") {
      alert("Fitur bagikan belum tersedia");
    }
    setContextMenu({ ...contextMenu, show: false });
  };

  return (
    <div className="min-h-screen p-4 bg-white dark:bg-black transition-colors text-black dark:text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Catatan</h1>
        <Button variant="ghost" onClick={toggleTheme}>
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {notes.map((note) => (
          <div
            key={note.id}
            onContextMenu={(e) => handleContextMenu(e, note.id)}
            className="p-4 rounded-xl bg-gray-200 dark:bg-gray-800 cursor-pointer"
          >
            <h2 className="font-bold">{note.title}</h2>
            <p className="text-xs opacity-70">{note.date}</p>
          </div>
        ))}
      </div>

      {contextMenu.show && (
        <div
          className="absolute bg-white dark:bg-gray-700 shadow-lg rounded-lg p-2 text-sm z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="block px-4 py-1 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleAction("edit")}>
            Edit
          </button>
          <button className="block px-4 py-1 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleAction("delete")}>
            Hapus
          </button>
          <button className="block px-4 py-1 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-600" onClick={() => handleAction("share")}>
            Bagikan
          </button>
        </div>
      )}
    </div>
  );
      }
