onload = () => {
  const c = setTimeout(() => {
    document.body.classList.remove("not-loaded");

    const titles = ('I LOVE U').split('TERAKHIR');
    const titleElement = document.getElementById('title');
    let index = 0;

    function appendTitle() {
      if (index < titles.length) {
        titleElement.innerHTML += titles[index];
        index++;
        setTimeout(appendTitle, 300); // 1000ms delay
      }
    }

    appendTitle();

    // Membuat dan menambahkan tombol
    const button = document.createElement('button');
    button.innerHTML = 'lanjut';
    button.onclick = () => {
      window.location.href = 'Bocil/baru/index.html'; // Ubah ini ke path folder yang diinginkan
    };
    document.body.appendChild(button);

    clearTimeout(c);
  }, 1000);
};
