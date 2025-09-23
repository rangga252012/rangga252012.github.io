function showID(game, id) {
  const display = document.getElementById('gameIdDisplay');
  display.innerHTML = `<strong>${game} ID:</strong><br><span style="font-size:1.3em;">${id}</span>`;
  display.classList.add('show');
}