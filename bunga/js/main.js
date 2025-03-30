onload = () => {
  const c = setTimeout(() => {
    document.body.classList.remove("not-loaded");

    const titles = [
      '1',
      '2',
      '3',
      '4',
      '5'
    ];
    const titleElement = document.getElementById('title');
    let index = 0;

    function appendTitle() {
      if (index < titles.length) {
        titleElement.innerHTML += titles[index] + '<br>'; // Add a line break after each "I LOVE U"
        index++;
        setTimeout(appendTitle, 300); // 300ms delay
      }
    }

    appendTitle();

    clearTimeout(c);
  }, 1000);
};
