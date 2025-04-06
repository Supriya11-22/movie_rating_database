const apiKey = "198f7f1703dfc8655aade37880896f0a";
const baseURL = "https://api.themoviedb.org/3";
const imgURL = "https://image.tmdb.org/t/p/w500";
const popularMoviesURL = `${baseURL}/discover/movie?sort_by=popularity.desc&api_key=${apiKey}&page=1`;
const searchURL = `${baseURL}/search/movie?api_key=${apiKey}&query=`;

const form = document.getElementById("search-form");
const query = document.getElementById("query");
const root = document.getElementById("root");

// Suggestions Box
const suggestionsBox = document.createElement("div");
suggestionsBox.id = "suggestions";
suggestionsBox.style.position = "absolute";
suggestionsBox.style.background = "white";
suggestionsBox.style.color = "black";
suggestionsBox.style.width = query.offsetWidth + "px";  // Match input width
suggestionsBox.style.maxWidth = "400px";
suggestionsBox.style.borderRadius = "5px";
suggestionsBox.style.boxShadow = "0px 4px 6px rgba(0, 0, 0, 0.2)";
suggestionsBox.style.zIndex = "1000";
suggestionsBox.style.display = "none";
suggestionsBox.style.top = query.offsetHeight + 5 + "px"; // Position below input
suggestionsBox.style.left = "0";
suggestionsBox.style.overflowY = "auto";
suggestionsBox.style.maxHeight = "200px"; // Avoid too many results showing at once

query.parentNode.style.position = "relative"; // Ensure parent is positioned
query.parentNode.appendChild(suggestionsBox);

// Fetch Suggestions Dynamically
query.addEventListener("input", async function () {
    const searchTerm = query.value.trim();
    if (searchTerm.length === 0) {
        suggestionsBox.style.display = "none";
        return;
    }

    const url = `${searchURL}${encodeURIComponent(searchTerm)}`;
    const response = await fetch(url);
    const data = await response.json();

    displaySuggestions(data.results);
});

// Display Suggestions Below Search Bar
function displaySuggestions(movies) {
    suggestionsBox.innerHTML = "";
    if (movies.length === 0) {
        suggestionsBox.style.display = "none";
        return;
    }

    movies.slice(0, 5).forEach(movie => {
        const suggestion = document.createElement("div");
        suggestion.textContent = movie.title;
        suggestion.style.padding = "10px";
        suggestion.style.borderBottom = "1px solid #ddd";
        suggestion.style.cursor = "pointer";
        suggestion.style.background = "white";

        suggestion.addEventListener("click", () => {
            query.value = movie.title;
            suggestionsBox.style.display = "none";
        });

        suggestionsBox.appendChild(suggestion);
    });

    suggestionsBox.style.display = "block";
}

// Hide Suggestions When Clicking Outside
document.addEventListener("click", (e) => {
    if (!query.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.style.display = "none";
    }
});

let page = 1,
    inSearchPage = false;

async function fetchData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error("Fetch Error:", error);
        root.innerHTML = "<p>⚠️ Failed to load movies. Please try again later.</p>";
        return null;
    }
}

const fetchAndShowResults = async (url) => {
    const data = await fetchData(url);
    console.log("Fetched Data:", data); // Check API response
    if (data) showResults(data.results);
};

const getSpecificPage = (pageNum) => {
    fetchAndShowResults(`${baseURL}/discover/movie?sort_by=popularity.desc&api_key=${apiKey}&page=${pageNum}`);
};

const movieCard = (movie) => {
    // Ensure poster_path is valid before using it
    const poster = movie.poster_path 
        ? `${imgURL}${movie.poster_path}` 
        : "https://via.placeholder.com/300x450?text=No+Image"; // Fallback image
    
    console.log("Movie Data:", movie); // Debugging: Check if `poster_path` exists

    return `
    <div class="col">
        <div class="card">
            <a class="card-media" href="https://www.themoviedb.org/movie/${movie.id}" target="_blank">
                <img src="${poster}" alt="${movie.original_title}" width="100%" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x450?text=No+Image';" />
            </a>
            <div class="card-content">
                <div class="card-cont-header">
                    <div class="cont-left">
                        <h3 style="font-weight: 600">${movie.original_title}</h3>
                        <span style="color: #12efec">${movie.release_date || 'N/A'}</span>
                        <p style="color: gold; font-weight: bold;">⭐ ${movie.vote_average.toFixed(1)} / 10</p>
                    </div>
                </div>
                <div class="describe">
                    ${movie.overview || 'No overview available.'}
                </div>
                <div class="cont-right">
                    <a href="${poster}" target="_blank" class="btn">See image</a>
                </div>
            </div>
        </div>
    </div>`;
};

const showResults = (items) => {
    let content = inSearchPage ? "" : root.innerHTML;
    if (items.length > 0) {
        items.forEach((item) => content += movieCard(item));
    } else {
        content += "<p>No results found!</p>";
    }
    root.innerHTML = content;
};

const handleLoadMore = () => {
    getSpecificPage(++page);
};

const detectEndAndLoadMore = () => {
    let el = document.documentElement;
    if (!inSearchPage && Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight - 10) {
        handleLoadMore();
    }
};

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    inSearchPage = true;
    const searchTerm = query.value.trim();
    if (searchTerm) {
        fetchAndShowResults(searchURL + encodeURIComponent(searchTerm));
    }
    query.value = "";
});

// Debounced Scroll Event for Better Performance
let debounceTimer;
window.addEventListener("scroll", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(detectEndAndLoadMore, 200);
});

function init() {
    inSearchPage = false;
    fetchAndShowResults(popularMoviesURL);
}

// Toast-based internet connection notifier
const connectionStatus = document.getElementById("connection-status");

window.addEventListener("offline", () => {
    connectionStatus.textContent = "You are offline. Please check your internet connection.";
    connectionStatus.style.backgroundColor = "#ff4d4d";
    connectionStatus.style.display = "block";
});

window.addEventListener("online", () => {
    connectionStatus.textContent = "You're back online!";
    connectionStatus.style.backgroundColor = "#4caf50";
    connectionStatus.style.display = "block";

    setTimeout(() => {
        connectionStatus.style.display = "none";
    }, 3000);
});

init();
