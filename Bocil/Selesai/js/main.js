onload = () => {
  const c = setTimeout(() => {
    document.body.classList.remove("not-loaded");

    const titles = ('I LOVE U').split('');
    const additionalTitles = ['A', 'B', 'C', 'D', 'E'];
    const titleElement = document.getElementById('title');
    let index = 0;
    let additionalIndex = 0;

    function appendTitle() {
      if (index < titles.length) {
        titleElement.innerHTML += titles[index];
        index++;
        setTimeout(appendTitle, 300); // 300ms delay
      } else if (additionalIndex < additionalTitles.length) {
        titleElement.innerHTML += additionalTitles[additionalIndex];
        additionalIndex++;
        setTimeout(appendTitle, 300); // 300ms delay
      }
    }

    appendTitle();

    clearTimeout(c);
  }, 1000);
};
