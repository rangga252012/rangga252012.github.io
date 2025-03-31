onload = () => {
  const c = setTimeout(() => {
    document.body.classList.remove("not-loaded");

    const titles = ['I LOVE U', 'YOU ARE AMAZING', 'NEVER GIVE UP', 'STAY POSITIVE', 'KEEP SMILING'];
    const titleElement = document.getElementById('title');
    let index = 0;
    let titleIndex = 0;

    function appendTitle() {
      if (index < titles[titleIndex].length) {
        titleElement.innerHTML += titles[titleIndex][index];
        index++;
        setTimeout(appendTitle, 300); // 300ms delay
      } else if (titleIndex < titles.length - 1) {
        titleIndex++;
        index = 0;
        titleElement.innerHTML += ' '; // Add space between titles
        setTimeout(appendTitle, 300); // 300ms delay
      }
    }

    appendTitle();

    clearTimeout(c);
  }, 1000);
};
