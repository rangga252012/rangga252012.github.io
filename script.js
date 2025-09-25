// Modal for game ID
function showGameID(game, id) {
  document.getElementById('game-title').textContent = game;
  document.getElementById('game-id').textContent = id;
  document.getElementById('modal-bg').style.display = 'flex';
}
function closeModal() {
  document.getElementById('modal-bg').style.display = 'none';
}

// Optional: close modal when clicking outside modal
document.getElementById('modal-bg').addEventListener('click', function(e){
  if(e.target === this) closeModal();
});