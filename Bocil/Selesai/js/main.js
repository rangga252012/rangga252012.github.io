onload = () => {
  const c = setTimeout(() => {
    document.body.classList.remove("not-loaded");

    const titles = ['I', 'LOVE', 'U'];
    const additionalTitles = ['A', 'B', 'C', 'D', 'E'];
    const allTitles = titles.concat(additionalTitles);
    const titleElement = document.getElementById('title');
    let index = 0;

    function displayTitle() {
      if (index < allTitles.length) {
        titleElement.innerHTML = allTitles[index]; // mengubah isi titleElement
        index++;
        setTimeout(() => {
          titleElement.innerHTML = ''; // menghilangkan isi titleElement
          setTimeout(displayTitle, 300); // 300ms delay sebelum menampilkan kata berikutnya
        }, 700); // 700ms delay sebelum menghilangkan kata
      }
    }

    displayTitle();

    clearTimeout(c);
  }, 1000);
};
