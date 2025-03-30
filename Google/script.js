function searchGoogle() {
    var query = document.getElementById('searchInput').value;
    window.location.href = 'https://www.google.com/search?q=' + encodeURIComponent(query);
}

function feelingLucky() {
    window.location.href = 'https://www.google.com/doodles';
}
