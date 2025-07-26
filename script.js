function showModal(imgSrc, desc) {
  document.getElementById('modalBg').style.display = 'flex';
  document.getElementById('modalImg').src = imgSrc;
  document.getElementById('modalDesc').innerText = desc;
}
function closeModal() {
  document.getElementById('modalBg').style.display = 'none';
}
