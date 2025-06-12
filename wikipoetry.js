document.addEventListener('DOMContentLoaded', function () {
    const captionArea = document.getElementById('caption');
    const wikiImage = document.getElementById('wiki-image');
    const invisibleInput = document.getElementById('invisible-input');
    let wordList = [];
    let placeholderText = "Start typing...";
    let hasTyped = false; 

    const tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.style.position = 'absolute';
    tooltip.style.padding = '10px';
    tooltip.style.background = '#fff';
    tooltip.style.color = '#000';
    tooltip.style.border = '1px solid #ccc'
    tooltip.style.borderRadius = '2px';
    tooltip.style.display = 'none';
    tooltip.style.maxWidth = '250px';
    tooltip.style.fontSize = '14px';
    document.body.appendChild(tooltip);

    captionArea.innerText = placeholderText;

    invisibleInput.focus();

    fetch('wikipedia.json')
        .then(response => response.json())
        .then(data => {
            wordList = data; 
            loadRandomImage(); 
        })
        .catch(error => {
            console.error('Error loading the JSON:', error);
        });

    invisibleInput.addEventListener('input', function () {
        let typedText = invisibleInput.value.trim();

        if (!hasTyped && typedText.length > 0) {
            hasTyped = true;
            captionArea.innerText = ''; 
        }

        updateCaption(typedText);

        let typedWords = typedText.split(' ');
        let lastWord = cleanWord(typedWords[typedWords.length - 1]);
        if (wordList.includes(lastWord)) {
            fetchWikipediaImage(lastWord);
        }
    });

    function cleanWord(word) {
        word = word.replace(/['’]s(?=[^a-zA-Z0-9]*$)/, '');

        word = word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, '');

        if (word.endsWith('s')) {
            word = word.slice(0, -1);
        }

        return word.toLowerCase(); 
    }

    function fetchWikipediaImage(keyword) {
        fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=pageimages&pithumbsize=300&titles=${keyword}`)
            .then(response => response.json())
            .then(data => {
                const pages = data.query.pages;
                const page = Object.values(pages)[0]; 

                if (page && page.thumbnail && page.thumbnail.source) {
                    wikiImage.src = page.thumbnail.source; 
                } else {
                    wikiImage.src = 'default-image.jpg'; 
                }
            })
            .catch(error => {
                console.error('Error fetching Wikipedia image:', error);
                wikiImage.src = 'default-image.jpg'; 
            });
    }

    function loadRandomImage() {
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        fetchWikipediaImage(randomWord);
    }

    function fetchWikipediaExtract(keyword) {
        return fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&prop=extracts&exsentences=2&exlimit=1&explaintext=1&titles=${keyword}`)
            .then(response => response.json())
            .then(data => {
                const pages = data.query.pages;
                const page = Object.values(pages)[0];

                if (page && page.extract) {
                    return page.extract; 
                }
                return 'No information available.';
            })
            .catch(error => {
                console.error('Error fetching Wikipedia extract:', error);
                return 'No information available.';
            });
    }

    function updateCaption(text) {
        let typedWords = text.split(' ');

        let updatedText = typedWords.map(word => {
            let cleanWordText = cleanWord(word); 
            if (wordList.includes(cleanWordText)) {
                return `<span class="clickable-word" data-word="${cleanWordText}" style="color:#004baa; cursor:pointer;"><b>${word}</b></span>`;
            }
            return word;
        }).join(' ');

        captionArea.innerHTML = updatedText;

        const clickableWords = captionArea.querySelectorAll('.clickable-word');
        clickableWords.forEach(wordElement => {
            wordElement.addEventListener('click', function () {
                const word = wordElement.getAttribute('data-word');
                fetchWikipediaImage(word); 
            });

            wordElement.addEventListener('mouseenter', function (e) {
                const word = wordElement.getAttribute('data-word');
                fetchWikipediaExtract(word).then(extract => {
                    tooltip.textContent = extract;
                    tooltip.style.display = 'block';
                });
            });

            wordElement.addEventListener('mousemove', function (e) {
                tooltip.style.left = e.pageX + 10 + 'px'; 
                tooltip.style.top = e.pageY + 10 + 'px';
            });

            wordElement.addEventListener('mouseleave', function () {
                tooltip.style.display = 'none'; 
            });
        });
    }

    document.body.addEventListener('click', function () {
        invisibleInput.focus(); 
    });
});