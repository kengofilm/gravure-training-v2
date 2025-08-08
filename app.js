// app.js (iOS互換版 v20250808-compat)
document.addEventListener("DOMContentLoaded", function () {
    const startTrainingBtn = document.getElementById("start-training");
    const glossaryBtn = document.getElementById("view-glossary");
    const contentDiv = document.getElementById("content");

    function loadJSON(url, callback) {
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("HTTP error " + response.status);
                return response.json();
            })
            .then(data => callback(null, data))
            .catch(err => callback(err, null));
    }

    function showTraining(questions) {
        let index = 0;
        let score = 0;

        function showQuestion() {
            if (index >= questions.length) {
                contentDiv.innerHTML = "<h2>終了！</h2><p>スコア: " + score + " / " + questions.length + "</p>";
                return;
            }
            const q = questions[index];
            let html = "<h3>Q" + (index + 1) + ". " + q.question + "</h3>";
            html += "<ul>";
            q.options.forEach(function (opt, i) {
                html += "<li><button class='answer-btn' data-index='" + i + "'>" + opt + "</button></li>";
            });
            html += "</ul>";
            contentDiv.innerHTML = html;

            Array.prototype.forEach.call(document.querySelectorAll(".answer-btn"), function (btn) {
                btn.addEventListener("click", function () {
                    const selectedIndex = parseInt(this.getAttribute("data-index"), 10);
                    if (selectedIndex === q.answer) {
                        score++;
                    }
                    index++;
                    showQuestion();
                });
            });
        }
        showQuestion();
    }

    function showGlossary(glossary) {
        let html = "<h2>用語集</h2><ul>";
        glossary.forEach(function (item) {
            html += "<li><strong>" + item.term + ":</strong> " + item.definition + "</li>";
        });
        html += "</ul>";
        contentDiv.innerHTML = html;
    }

    startTrainingBtn.addEventListener("click", function () {
        loadJSON("data/questions.json", function (err, data) {
            if (err) {
                contentDiv.innerHTML = "<p>問題データの読み込みエラー: " + err.message + "</p>";
            } else {
                showTraining(data);
            }
        });
    });

    glossaryBtn.addEventListener("click", function () {
        loadJSON("data/glossary.json", function (err, data) {
            if (err) {
                contentDiv.innerHTML = "<p>用語集の読み込みエラー: " + err.message + "</p>";
            } else {
                showGlossary(data);
            }
        });
    });
});
