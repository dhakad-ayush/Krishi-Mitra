// This function runs when the entire page is loaded
document.addEventListener('DOMContentLoaded', function() {
    const page = window.location.pathname.split("/").pop();

    // Run login/signup functions first as they don't have the main navbar/language switcher
    if (page === 'login.html') {
        setupLoginPage();
        return; 
    }
    if (page === 'signup.html') {
        setupSignupPage();
        return; 
    }

    // For all other pages, setup the language switcher and navbar
    updateNavbarForLoggedInUser();
    setupLanguageSwitcher();
    setupChatbot();

    // Now, run the function for the specific page
    if (page === 'index.html' || page === '') {
        setupDashboardPage();
    } else if (page === 'market.html') {
        setupMarketPage();
    } else if (page === 'disease.html') {
        setupDiseaseDetectorPage();
    } else if (page === 'guide.html') {
        setupGuidePage();
    } else if (page === 'schemes.html') {
        setupSchemesPage();
    }
});


// -- AUTHENTICATION LOGIC --
function setupLoginPage() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'index.html';
        return;
    }
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(event) {
            event.preventDefault();
            const mobile = document.getElementById('mobileNumber').value;
            const password = document.getElementById('password').value;
            if (mobile.length !== 10 || isNaN(mobile)) {
                alert('Please enter a valid 10-digit mobile number.');
                return;
            }
            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }
            localStorage.setItem('isLoggedIn', 'true');
            alert('Login successful! Redirecting to dashboard...');
            window.location.href = 'index.html';
        });
    }
}

function setupSignupPage() {
    if (localStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'index.html';
        return;
    }
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(event) {
            event.preventDefault();
            alert('Sign up successful! Please login.');
            window.location.href = 'login.html';
        });
    }
}

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    alert('You have been logged out.');
    window.location.href = 'login.html';
}

function updateNavbarForLoggedInUser() {
    const authButtonContainer = document.getElementById('auth-button-container');
    if (localStorage.getItem('isLoggedIn') === 'true' && authButtonContainer) {
        authButtonContainer.innerHTML = `<button class="btn btn-danger btn-sm" id="logoutBtn" data-lang-en="Logout" data-lang-hi="लॉगआउट">Logout</button>`;
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    }
}


// -- LANGUAGE SWITCHER LOGIC --
function setupLanguageSwitcher() {
    updateButtonStates();
    document.querySelectorAll('.language-btn').forEach(button => {
        button.addEventListener('click', function() {
            const selectedLang = this.dataset.lang;
            applyTranslations(selectedLang);
            updateButtonStates(selectedLang);
        });
    });
    applyTranslations('en');
}

function applyTranslations(lang) {
    document.querySelectorAll('[data-lang-en]').forEach(element => {
        const enText = element.dataset.langEn;
        const hiText = element.dataset.langHi;
        const enPlaceholder = element.dataset.langEnPlaceholder;
        const hiPlaceholder = element.dataset.langHiPlaceholder;

        if ((element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') && enPlaceholder) {
            element.setAttribute('placeholder', (lang === 'hi' && hiPlaceholder) ? hiPlaceholder : enPlaceholder);
        } else {
            element.innerText = (lang === 'hi' && hiText) ? hiText : enText;
        }
    });
}

function updateButtonStates(currentLang = 'en') {
    document.querySelectorAll('.language-btn').forEach(button => {
        button.classList.remove('btn-light', 'btn-outline-light');
        if (button.dataset.lang === currentLang) {
            button.classList.add('btn-light');
        } else {
            button.classList.add('btn-outline-light');
        }
    });
}


// -- DASHBOARD PAGE FUNCTIONS --
function setupDashboardPage() {
     updateDateTime();
    requestLocation();
    fetchMarketPrices();
    const recommendationForm = document.getElementById('crop-recommendation-form');
    if (recommendationForm) {
        recommendationForm.addEventListener('submit', handleCropRecommendation);
    }
}


// -- MARKET PAGE FUNCTIONS --
function setupMarketPage() {
    const marketData = {
        indore: {
            soybean: { name_en: "Soybean", name_hi: "सोयाबीन", min: 4650, max: 4850, modal: 4750, change: 25, trend: [4700, 4720, 4710, 4740, 4730, 4725, 4750] },
            wheat: { name_en: "Wheat", name_hi: "गेहूं", min: 2380, max: 2450, modal: 2410, change: -15, trend: [2450, 2440, 2435, 2420, 2430, 2425, 2410] },
            gram: { name_en: "Gram", name_hi: "चना", min: 6000, max: 6250, modal: 6100, change: 80, trend: [5950, 5980, 6010, 6000, 6020, 6020, 6100] },
            onion: { name_en: "Onion", name_hi: "प्याज", min: 1800, max: 2200, modal: 2000, change: 150, trend: [1850, 1880, 1900, 1920, 1950, 1980, 2000] },
            potato: { name_en: "Potato", name_hi: "आलू", min: 1500, max: 1800, modal: 1650, change: -25, trend: [1700, 1680, 1670, 1660, 1650, 1655, 1650] },
            garlic: { name_en: "Garlic", name_hi: "लहसुन", min: 8000, max: 9500, modal: 8800, change: 200, trend: [8200, 8300, 8450, 8500, 8600, 8750, 8800] }
        },
        ujjain: { /* ... Ujjain data ... */ },
        bhopal: { /* ... Bhopal data ... */ }
    };
    const mandiSelect = document.getElementById('mandiSelect');
    const cropSelect = document.getElementById('cropSelect');
    let priceChart = null;
    let distributionChart = null;

    function updateMarketPage() {
        const lang = document.querySelector('.language-btn.active')?.dataset.lang || 'en';
        const selectedMandi = mandiSelect.value;
        const selectedCrop = cropSelect.value;
        const data = marketData[selectedMandi];
        const featuredCropData = data[selectedCrop];

        document.getElementById('featured-crop-title').innerText = lang === 'hi' ? `${featuredCropData.name_hi} के आज के भाव` : `Today's Price for ${featuredCropData.name_en}`;
        document.getElementById('min-price').innerText = `₹${featuredCropData.min}`;
        document.getElementById('modal-price').innerText = `₹${featuredCropData.modal}`;
        document.getElementById('max-price').innerText = `₹${featuredCropData.max}`;

        const chartTitle = document.getElementById('chart-title');
        chartTitle.innerText = lang === 'hi' ? `${featuredCropData.name_hi} का मूल्य ट्रेंड` : `${featuredCropData.name_en} Price Trend`;
        const lineChartData = {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Today'],
            datasets: [{ label: `Price of ${featuredCropData.name_en}`, data: featuredCropData.trend, borderColor: '#198754', backgroundColor: 'rgba(25, 135, 84, 0.1)', fill: true, tension: 0.3 }]
        };
        if (priceChart) { priceChart.data = lineChartData; priceChart.update(); } 
        else { const ctx = document.getElementById('priceChart').getContext('2d'); priceChart = new Chart(ctx, { type: 'line', data: lineChartData }); }

        const pieChartLabels = Object.values(data).map(crop => lang === 'hi' ? crop.name_hi : crop.name_en);
        const pieChartPrices = Object.values(data).map(crop => crop.modal);
        const pieChartData = {
            labels: pieChartLabels,
            datasets: [{ label: 'Modal Price Distribution', data: pieChartPrices, backgroundColor: ['#28a745', '#0d6efd', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'] }]
        };
        if (distributionChart) { distributionChart.data = pieChartData; distributionChart.update(); } 
        else { const ctx = document.getElementById('distributionChart').getContext('2d'); distributionChart = new Chart(ctx, { type: 'pie', data: pieChartData }); }

        let tableBodyHtml = '';
        let topGainer = { name_en: '--', name_hi: '--', change: -Infinity };
        let topLoser = { name_en: '--', name_hi: '--', change: Infinity };

        for (const cropKey in data) {
            const crop = data[cropKey];
            const changeClass = crop.change >= 0 ? 'price-up' : 'price-down';
            const changeIcon = crop.change >= 0 ? '▲' : '▼';
            const cropName = lang === 'hi' ? crop.name_hi : crop.name_en;
            tableBodyHtml += `<tr><td>${cropName}</td><td>₹${crop.modal}</td><td class="${changeClass}">${changeIcon} ₹${Math.abs(crop.change)}</td></tr>`;
            if (crop.change > topGainer.change) topGainer = crop;
            if (crop.change < topLoser.change) topLoser = crop;
        }
        document.getElementById('price-table-body').innerHTML = tableBodyHtml;
        
        document.getElementById('top-gainer-name').innerText = lang === 'hi' ? topGainer.name_hi : topGainer.name_en;
        document.getElementById('top-gainer-change').innerText = `▲ ₹${topGainer.change}`;
        document.getElementById('top-loser-name').innerText = lang === 'hi' ? topLoser.name_hi : topLoser.name_en;
        document.getElementById('top-loser-change').innerText = `▼ ₹${Math.abs(topLoser.change)}`;
    }

    mandiSelect.addEventListener('change', updateMarketPage);
    cropSelect.addEventListener('change', updateMarketPage);
    updateMarketPage();
}


// -- DISEASE DETECTOR PAGE FUNCTIONS --
function setupDiseaseDetectorPage() {
    const imageUpload = document.getElementById('imageUpload');
    if (!imageUpload) return;
    const imagePreview = document.getElementById('imagePreview');
    const detectDiseaseBtn = document.getElementById('detectDiseaseBtn');
    const manualDetectionForm = document.getElementById('manualDetectionForm');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const resultArea = document.getElementById('resultArea');
    const uploadPane = document.getElementById('upload-pane');
    const manualPane = document.getElementById('manual-pane');

    const diseases = [
        {
            name_en: "Blight", name_hi: "झुलसा रोग",
            confidence: "92%",
            desc_en: "A fungal disease causing rapid browning, wilting, and death of plant tissues.",
            desc_hi: "एक फंगल रोग जो पौधे के ऊतकों के तेजी से भूरे होने, मुरझाने और मृत्यु का कारण बनता है।",
            symptoms_en: ["Dark, water-soaked spots on leaves.", "Rapid browning and wilting."],
            symptoms_hi: ["पत्तियों पर गहरे, पानी से भरे धब्बे।", "तेजी से भूरा होना और मुरझाना।"],
            remedies_en: ["Remove and destroy infected parts.", "Apply fungicides."],
            remedies_hi: ["संक्रमित भागों को हटाकर नष्ट कर दें।", "कवकनाशी का प्रयोग करें।"]
        },
        {
            name_en: "Rust", name_hi: "रस्ट रोग",
            confidence: "85%",
            desc_en: "Fungal disease characterized by reddish-brown or orange pustules on leaves.",
            desc_hi: "पत्तियों पर लाल-भूरे या नारंगी दानों की विशेषता वाला फंगल रोग।",
            symptoms_en: ["Small, raised pustules (red, orange, brown).", "Yellowing of leaves."],
            symptoms_hi: ["छोटे, उभरे हुए दाने (लाल, नारंगी, भूरे)।", "पत्तियों का पीला पड़ना।"],
            remedies_en: ["Use resistant crop varieties.", "Rotate crops."],
            remedies_hi: ["प्रतिरोधी फसल किस्मों का उपयोग करें।", "फसल चक्र अपनाएं।"]
        },
    ];

    function getRandomDisease() { return diseases[Math.floor(Math.random() * diseases.length)]; }

    function showLoading() {
        resultArea.style.display = 'none';
        uploadPane.style.display = 'none';
        manualPane.style.display = 'none';
        document.querySelector('.nav-tabs').style.display = 'none';
        loadingSpinner.style.display = 'block';
    }

    function displayResult(disease) {
        loadingSpinner.style.display = 'none';
        resultArea.style.display = 'block';
        const lang = document.querySelector('.language-btn.active')?.dataset.lang || 'en';
        document.getElementById('detectedDiseaseName').innerText = lang === 'hi' ? disease.name_hi : disease.name_en;
        document.getElementById('confidenceLevel').innerText = disease.confidence;
        document.getElementById('diseaseDescription').innerText = lang === 'hi' ? disease.desc_hi : disease.desc_en;
        const symptomsList = document.getElementById('diseaseSymptoms');
        symptomsList.innerHTML = '';
        const symptoms = lang === 'hi' ? disease.symptoms_hi : disease.symptoms_en;
        symptoms.forEach(symptom => {
            const li = document.createElement('li');
            li.innerText = symptom;
            symptomsList.appendChild(li);
        });
        const remediesList = document.getElementById('diseaseRemedies');
        remediesList.innerHTML = '';
        const remedies = lang === 'hi' ? disease.remedies_hi : disease.remedies_en;
        remedies.forEach(remedy => {
            const li = document.createElement('li');
            li.innerText = remedy;
            remediesList.appendChild(li);
        });
        applyTranslations(lang);
    }

    imageUpload.addEventListener('change', function(event) {
        if (event.target.files && event.target.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                detectDiseaseBtn.style.display = 'inline-block';
            };
            reader.readAsDataURL(event.target.files[0]);
        }
    });

    detectDiseaseBtn.addEventListener('click', function() {
        showLoading();
        setTimeout(() => { displayResult(getRandomDisease()); }, 2000);
    });

    manualDetectionForm.addEventListener('submit', function(event) {
        event.preventDefault();
        showLoading();
        setTimeout(() => { displayResult(getRandomDisease()); }, 2000);
    });
}


// -- GUIDE PAGE FUNCTIONS --
function setupGuidePage() {
   const calculateBtn = document.getElementById('calculateFert');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', function() {
            const resultDiv = document.getElementById('fertResult');
            const crop = document.getElementById('fertCropSelect').value;
            const size = parseFloat(document.getElementById('farmSize').value);

            if (isNaN(size) || size <= 0) {
                resultDiv.innerHTML = `<div class="col-12"><div class="alert alert-danger">Please enter a valid farm size.</div></div>`;
                return;
            }
            const recommendations = {
                wheat: { urea: 50, dap: 25, potash: 10 },
                soybean: { urea: 10, ssp: 50, potash: 15 },
                cotton: { urea: 60, dap: 30, potash: 20 }
            };

            const rec = recommendations[crop];
            const totalUrea = (rec.urea * size).toFixed(0);
            const totalDAP = (rec.dap * size).toFixed(0);
            const totalPotash = (rec.potash * size).toFixed(0);
            
            // THE FIX IS HERE: Changed ${totalUa} to ${totalUrea}
            resultDiv.innerHTML = `
                <div class="col-md-4">
                    <div class="result-card">
                        <h6 class="text-muted" data-lang-en="Urea" data-lang-hi="यूरिया">Urea</h6>
                        <p class="display-6">${totalUrea} <small class="fs-5 text-muted">kg</small></p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="result-card">
                        <h6 class="text-muted" data-lang-en="DAP/SSP" data-lang-hi="डीएपी/एसएसपी">DAP/SSP</h6>
                        <p class="display-6">${totalDAP} <small class="fs-5 text-muted">kg</small></p>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="result-card">
                        <h6 class="text-muted" data-lang-en="Potash" data-lang-hi="पोटाश">Potash</h6>
                        <p class="display-6">${totalPotash} <small class="fs-5 text-muted">kg</small></p>
                    </div>
                </div>`;
            applyTranslations(document.querySelector('.language-btn.active')?.dataset.lang || 'en');
        });
    }

    const pestDetailModal = document.getElementById('pestDetailModal');
    if (pestDetailModal) {
        const pestData = {
            whitefly: { name_en: "Whitefly", name_hi: "सफेद मक्खी", img: "https://storage.googleapis.com/gweb-aip-images/whitefly.jpg", desc_en: "Sucks sap from leaves...", desc_hi: "पत्तियों से रस चूसती है...", remedies_en: ["Use yellow sticky traps."], remedies_hi: ["पीले चिपचिपे ट्रैप का प्रयोग करें।"] },
            aphids: { name_en: "Aphids", name_hi: "माहू", img: "https://storage.googleapis.com/gweb-aip-images/aphids.jpg", desc_en: "Small insects...", desc_hi: "छोटे कीड़े...", remedies_en: ["Spray with water."], remedies_hi: ["पानी से स्प्रे करें।"] },
            bollworm: { name_en: "Bollworm", name_hi: "सुंडी", img: "https://storage.googleapis.com/gweb-aip-images/bollworm.jpg", desc_en: "A major pest...", desc_hi: "एक प्रमुख कीट...", remedies_en: ["Install traps."], remedies_hi: ["ट्रैप लगाएं।"] }
        };
        pestDetailModal.addEventListener('show.bs.modal', function(event) {
            const card = event.relatedTarget;
            const pestId = card.dataset.pest;
            const data = pestData[pestId];
            const lang = document.querySelector('.language-btn.active')?.dataset.lang || 'en';
            const modalTitle = pestDetailModal.querySelector('.modal-title');
            const modalImage = pestDetailModal.querySelector('#pestModalImage');
            const modalContent = pestDetailModal.querySelector('#pestModalContent');
            
            modalTitle.innerText = lang === 'hi' ? data.name_hi : data.name_en;
            modalImage.src = data.img;
            
            let remediesList = '';
            const remedies = lang === 'hi' ? data.remedies_hi : data.remedies_en;
            remedies.forEach(remedy => { remediesList += `<li>${remedy}</li>`; });

            modalContent.innerHTML = `<p>${lang === 'hi' ? data.desc_hi : data.desc_en}</p><h6 class="mt-3">${lang === 'hi' ? 'नियंत्रण के उपाय' : 'Control Measures'}</h6><ul>${remediesList}</ul>`;
        });
    }
}


// -- SCHEMES PAGE FUNCTIONS --
function setupSchemesPage() {
     // Expanded schemes data
    const schemesData = [
        {
            id: 1, name_en: "PM Kisan Samman Nidhi", name_hi: "पीएम किसान सम्मान निधि",
            category: "central", type_en: "Financial Aid", type_hi: "वित्तीय सहायता", status: "open",
            desc_en: "Income support scheme providing ₹6,000 per year in three equal installments.",
            desc_hi: "आय सहायता योजना जो तीन समान किश्तों में प्रति वर्ष ₹6,000 प्रदान करती है।",
            link: "#"
        },
        {
            id: 2, name_en: "PM Fasal Bima Yojana (PMFBY)", name_hi: "पीएम फसल बीमा योजना (PMFBY)",
            category: "central", type_en: "Insurance", type_hi: "बीमा", status: "open",
            desc_en: "Crop insurance scheme to provide financial support for crop loss or damage.",
            desc_hi: "फसल हानि या क्षति के लिए किसानों को वित्तीय सहायता प्रदान करने हेतु फसल बीमा योजना।",
            link: "#"
        },
        {
            id: 3, name_en: "Kisan Credit Card (KCC)", name_hi: "किसान क्रेडिट कार्ड (KCC)",
            category: "central", type_en: "Loan/Credit", type_hi: "ऋण/क्रेडिट", status: "open",
            desc_en: "Provides farmers with timely access to credit for their cultivation and other needs.",
            desc_hi: "किसानों को उनकी खेती और अन्य जरूरतों के लिए समय पर ऋण उपलब्ध कराता है।",
            link: "#"
        },
        {
            id: 4, name_en: "Mukhyamantri Kisan Kalyan Yojana", name_hi: "मुख्यमंत्री किसान कल्याण योजना",
            category: "state", type_en: "Financial Aid", type_hi: "वित्तीय सहायता", status: "open",
            desc_en: "A Madhya Pradesh state scheme providing an additional ₹6,000 per year to PM-KISAN beneficiaries.",
            desc_hi: "एक मध्य प्रदेश राज्य योजना जो पीएम-किसान लाभार्थियों को प्रति वर्ष अतिरिक्त ₹6,000 प्रदान करती है।",
            link: "#"
        },
        {
            id: 5, name_en: "Soil Health Card Scheme", name_hi: "मृदा स्वास्थ्य कार्ड योजना",
            category: "central", type_en: "Soil Health", type_hi: "मृदा स्वास्थ्य", status: "open",
            desc_en: "Provides farmers with soil health cards to help them use fertilizers judiciously.",
            desc_hi: "किसानों को मृदा स्वास्थ्य कार्ड प्रदान करता है ताकि वे उर्वरकों का विवेकपूर्ण उपयोग कर सकें।",
            link: "#"
        },
        {
            id: 6, name_en: "Paramparagat Krishi Vikas Yojana (PKVY)", name_hi: "परम्परागत कृषि विकास योजना (PKVY)",
            category: "central", type_en: "Organic Farming", type_hi: "जैविक खेती", status: "open",
            desc_en: "Promotes organic farming through the adoption of organic villages by cluster approach.",
            desc_hi: "क्लस्टर दृष्टिकोण द्वारा जैविक गांव को अपनाकर जैविक खेती को बढ़ावा देता है।",
            link: "#"
        },
        {
            id: 7, name_en: "National Food Security Mission", name_hi: "राष्ट्रीय खाद्य सुरक्षा मिशन",
            category: "central", type_en: "Subsidy", type_hi: "सब्सिडी", status: "closed",
            desc_en: "Aims to increase production of rice, wheat, and pulses through various interventions.",
            desc_hi: "विभिन्न हस्तक्षेपों के माध्यम से चावल, गेहूं और दालों का उत्पादन बढ़ाना है।",
            link: "#"
        }
    ];

    const schemesGrid = document.getElementById('schemes-grid');
    const noResultsDiv = document.getElementById('no-results');
    const searchInput = document.getElementById('schemeSearch');
    const filterButtons = document.querySelectorAll('.filter-buttons .btn');

    function renderSchemes(filter = 'all', searchTerm = '') {
        schemesGrid.innerHTML = '';
        const lang = document.querySelector('.language-btn.active')?.dataset.lang || 'en';
        searchTerm = searchTerm.toLowerCase();

        const filteredSchemes = schemesData.filter(scheme => {
            const name = (lang === 'hi' ? scheme.name_hi : scheme.name_en).toLowerCase();
            const categoryMatch = (filter === 'all') || (scheme.category === filter) || (filter === 'insurance' && scheme.type_en === 'Insurance');
            const searchMatch = name.includes(searchTerm);
            return categoryMatch && searchMatch;
        });

        if (filteredSchemes.length === 0) {
            noResultsDiv.style.display = 'block';
        } else {
            noResultsDiv.style.display = 'none';
        }

        filteredSchemes.forEach(scheme => {
            const name = lang === 'hi' ? scheme.name_hi : scheme.name_en;
            const desc = lang === 'hi' ? scheme.desc_hi : scheme.desc_en;
            const statusClass = scheme.status === 'open' ? 'bg-success' : 'bg-danger';
            const statusText_en = scheme.status === 'open' ? 'Application Open' : 'Application Closed';
            const statusText_hi = scheme.status === 'open' ? 'आवेदन खुला है' : 'आवेदन बंद है';
            const statusText = lang === 'hi' ? statusText_hi : statusText_en;
            const categoryText_en = scheme.category.charAt(0).toUpperCase() + scheme.category.slice(1);
            const categoryText_hi = scheme.category === 'central' ? 'केंद्र' : 'राज्य';
            const categoryText = lang === 'hi' ? categoryText_hi : categoryText_en;
            const learnMore_en = "Learn More & Apply";
            const learnMore_hi = "और जानें और आवेदन करें";
            const learnMore = lang === 'hi' ? learnMore_hi : learnMore_en;

            const cardHTML = `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card scheme-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <span class="badge rounded-pill bg-primary">${categoryText}</span>
                                <span class="badge rounded-pill ${statusClass}">${statusText}</span>
                            </div>
                            <h5 class="card-title">${name}</h5>
                            <p class="card-text text-muted">${desc}</p>
                            <a href="${scheme.link}" class="btn btn-success mt-auto">
                                <span>${learnMore}</span> 
                                <i class="bi bi-box-arrow-up-right ms-2"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
            schemesGrid.innerHTML += cardHTML;
        });
    }

    // Event Listeners
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = button.dataset.filter;
            renderSchemes(filter, searchInput.value);
        });
    });

    searchInput.addEventListener('keyup', () => {
        const filter = document.querySelector('.filter-buttons .btn.active').dataset.filter;
        renderSchemes(filter, searchInput.value);
    });

    // Initial render
    renderSchemes();
}

// -- CHATBOT FUNCTIONS --

function setupChatbot() {
    const chatToggleButton = document.getElementById('chat-toggle-button');
    const chatCloseButton = document.getElementById('chat-close-button');
    const chatWindow = document.getElementById('chat-window');

    if (!chatToggleButton) return; // Only run on pages with the chatbot

    chatToggleButton.addEventListener('click', () => toggleChat(true));
    chatCloseButton.addEventListener('click', () => toggleChat(false));

    // Initialize with the starting message
    displayChatResponse('start');
}

function toggleChat(open) {
    const chatWindow = document.getElementById('chat-window');
    chatWindow.style.display = open ? 'flex' : 'none';
}

function displayChatResponse(nodeKey) {
    const messagesContainer = document.getElementById('chat-messages');
    const optionsContainer = document.getElementById('chat-options');

    // The "Brain" of our chatbot
    const chatbotBrain = {
        'start': {
            text: "नमस्ते! मैं कृषि मित्र सहायक हूँ। मैं आपकी क्या मदद कर सकता हूँ?",
            options: [
                { text: "मौसम की जानकारी", nextNode: "weather" },
                { text: "मंडी के भाव", nextNode: "mandi" },
                { text: "फसल रोग", nextNode: "disease" },
            ]
        },
        'weather': {
            text: "ठीक है, मौसम के बारे में आप क्या जानना चाहते हैं?",
            options: [
                { text: "आज का मौसम", action: () => alert("आज मौसम साफ है। तापमान 29°C है।") },
                { text: "अगले 5 दिन", action: () => alert("अगले 5 दिन मौसम साफ रहेगा।") },
                { text: "वापस जाएं", nextNode: "start" }
            ]
        },
        'mandi': {
            text: "आपको किस फसल का भाव जानना है?",
            options: [
                { text: "सोयाबीन", action: () => alert("आज सोयाबीन का भाव ₹4750/क्विंटल है।") },
                { text: "गेहूं", action: () => alert("आज गेहूं का भाव ₹2410/क्विंटल है।") },
                { text: "वापस जाएं", nextNode: "start" }
            ]
        },
        'disease': {
            text: "फसल रोग की जानकारी के लिए, कृपया 'Disease Detector' पेज पर जाएं।",
            options: [
                { text: "पेज पर ले जाएं", action: () => window.location.href = 'disease.html' },
                { text: "वापस जाएं", nextNode: "start" }
            ]
        }
    };

    const node = chatbotBrain[nodeKey];

    // Display the bot's message
    const botMessage = document.createElement('div');
    botMessage.className = 'chat-message bot';
    botMessage.innerText = node.text;
    messagesContainer.appendChild(botMessage);

    // Clear previous options
    optionsContainer.innerHTML = '';

    // Display the new options as buttons
    node.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'btn btn-outline-success';
        button.innerText = option.text;
        button.addEventListener('click', () => {
            if (option.nextNode) {
                displayChatResponse(option.nextNode);
            } else if (option.action) {
                option.action();
                toggleChat(false); // Close chat after action
            }
        });
        optionsContainer.appendChild(button);
    });

    // Scroll to the latest message
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
