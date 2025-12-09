// Dark Mode Toggle
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('theme-toggle');
    const body = document.body;
    const hamburger = document.getElementById('hamburger-menu');
    const navMenu = document.querySelector('.nav-menu');

    // Function to apply the theme
    const applyTheme = () => {
        if (body.classList.contains('dark')) {
            toggleBtn.textContent = '☀️ Light Mode';
        } else {
            toggleBtn.textContent = '🌙 Dark Mode';
        }
    };

    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark');
        applyTheme();
    });

    // Hamburger Menu Toggle
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        body.classList.toggle('menu-open');
        navMenu.classList.toggle('active');
    });

    // Highlight active navigation link
    const currentPath = window.location.pathname.split('/').pop(); // Get current page filename
    const navLinks = navMenu.querySelectorAll('a');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href').split('/').pop();
        if (linkPath === currentPath || (currentPath === '' && linkPath === 'index.html')) {
            link.classList.add('active-nav-link');
        }
    });


    // Scroll Animation (Fade In Up)
    const animateOnScrollElements = document.querySelectorAll('[data-animate="fade-in-up"]');

    const observerOptions = {
        root: null, // viewport
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                    entry.target.classList.add('animated');

                observer.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, observerOptions);

    animateOnScrollElements.forEach(element => {
        observer.observe(element);
    });

    // === Contact Form AJAX Submission with Animation ===
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        // The JavaScript logic for the contact form has been removed.
        // FormSubmit.co will now handle the submission directly as intended.
    }

    // === Firebase Integration for Likes & Comments (Universal Fix) ===
    function initializeFirebaseFeatures() {
        if (typeof firebase === 'undefined' || typeof firebase.initializeApp !== 'function') {
            console.warn("Firebase not loaded, interactive features disabled.");
            return;
        }

        // Find your config in your Firebase project settings
        const firebaseConfig = {
            apiKey: "AIzaSyBDWWNQ3og4UXp8NvbY-1QJsT8Q2QH27H8",
            authDomain: "storywave-c6fbe.firebaseapp.com",
            projectId: "storywave-c6fbe",
            storageBucket: "storywave-c6fbe.appspot.com",
            messagingSenderId: "623345857055",
            appId: "1:623345857055:web:e0275651c0433b700d1b2a"
        };

        // Initialize Firebase only if it hasn't been initialized yet
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        const db = firebase.firestore();

        // Get a unique ID for the current blog post (using the filename)
        const postId = window.location.pathname.split('/').pop().replace('.html', '');

        // Check if we are on a blog post page by looking for the comment section
        const commentSection = document.querySelector('.comment-section');
        if (commentSection) {
            const likeButton = document.getElementById('like-button');
            const likeCountSpan = document.getElementById('like-count');
            const likesDocRef = db.collection('likes').doc(postId);

            // --- Likes Logic ---
            const updateLikeButton = (liked) => {
                if (liked) {
                    likeButton.classList.add('liked');
                } else {
                    likeButton.classList.remove('liked');
                }
            };

            const hasLiked = localStorage.getItem(`liked_${postId}`);
            updateLikeButton(hasLiked);

            likeButton.addEventListener('click', () => {
                const hasLikedNow = localStorage.getItem(`liked_${postId}`);
                const increment = firebase.firestore.FieldValue.increment(hasLikedNow ? -1 : 1);

                likesDocRef.set({ count: increment }, { merge: true });

                if (hasLikedNow) {
                    localStorage.removeItem(`liked_${postId}`);
                    updateLikeButton(false);
                } else {
                    localStorage.setItem(`liked_${postId}`, 'true');
                    updateLikeButton(true);
                }
            });

            likesDocRef.onSnapshot((doc) => {
                if (doc.exists) {
                    likeCountSpan.textContent = doc.data().count || 0;
                } else {
                    likeCountSpan.textContent = 0;
                }
            });

            // --- Comments Logic ---
            const commentForm = document.getElementById('comment-form');
            const commentsList = document.getElementById('comments-list');
            const submitButton = commentForm.querySelector('.submit-button');
            const buttonText = submitButton.querySelector('.button-text');
            const commentsColRef = db.collection('comments').doc(postId).collection('user_comments');
            const originalButtonText = buttonText.textContent;

            commentForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                submitButton.disabled = true;
                submitButton.classList.add('loading');

                const name = document.getElementById('comment-name').value.trim();
                const text = document.getElementById('comment-text').value.trim();

                if (name && text) {
                    try {
                        await commentsColRef.add({
                            name: name,
                            text: text,
                            timestamp: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        submitButton.classList.remove('loading');
                        submitButton.classList.add('success');
                        buttonText.textContent = 'Sent ✔️';
                        commentForm.reset();
                    } catch (error) {
                        console.error("Error adding document: ", error);
                        submitButton.classList.remove('loading');
                        submitButton.classList.add('failed');
                        buttonText.textContent = 'Failed ❌';
                    } finally {
                        setTimeout(() => {
                            submitButton.disabled = false;
                            submitButton.classList.remove('success', 'failed');
                            buttonText.textContent = originalButtonText;
                        }, 3000);
                    }
                } else {
                    // Handle empty form case
                    submitButton.disabled = false;
                    submitButton.classList.remove('loading');
                }
            });

            commentsColRef.orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
                commentsList.innerHTML = '';
                if (snapshot.empty) {
                    commentsList.innerHTML = '<p>Be the first to comment!</p>';
                } else {
                    snapshot.forEach((doc) => {
                        const comment = doc.data();
                        if (comment.timestamp) {
                            const commentEl = document.createElement('div');
                            commentEl.classList.add('comment');
                            const date = comment.timestamp.toDate().toLocaleString();
                            commentEl.innerHTML = `
                                <p class="comment-author">${comment.name} <span class="comment-date">${date}</span></p>
                                <p class="comment-text">${comment.text}</p>
                            `;
                            commentsList.appendChild(commentEl);
                        }
                    });
                }
            });
        }
    }

    initializeFirebaseFeatures();

    // Social Share Link Generator
    function setupShareLinks() {
        const pageUrl = encodeURIComponent(window.location.href);
        const pageTitle = encodeURIComponent(document.title);

        const twitterShare = document.querySelector('.share-twitter');
        if (twitterShare) {
            twitterShare.href = `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`;
        }

        const facebookShare = document.querySelector('.share-facebook');
        if (facebookShare) {
            facebookShare.href = `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
        }

        const linkedinShare = document.querySelector('.share-linkedin');
        if (linkedinShare) {
            linkedinShare.href = `https://www.linkedin.com/shareArticle?mini=true&url=${pageUrl}&title=${pageTitle}`;
        }
    }
    setupShareLinks();

    // === Internal Linking for "Read More" Section ===
    const allPosts = [
        { url: 'overthinking.html', title: 'How to Stop Overthinking: A Guide to a Calmer Mind', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=75' },
        { url: 'forcing.html', title: 'Stop Forcing Yourself to Be Strong: The Power of Vulnerability', image: 'https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?auto=format&fit=crop&w=800&q=75' },
        { url: 'silent.html', title: 'The Silent Pressure Young People Carry', image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=75' },
        { url: 'stuck.html', title: 'Why You Feel Stuck (Even When You\'re Trying Your Best)', image: 'images/powerful-habits.jpg' },
        { url: 'how-to-invest-smartly.html', title: 'How to Invest Smartly in Your 20s (Even with Little Money)', image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80' },
        { url: 'mistakes.html', title: '10 Common Mistakes Students Make', image: 'images/student.jpg' },
        { url: 'mental.html', title: 'Understanding Mental Health: Why It Matters', image: 'images/mental.jpg' },
        { url: 'smart-money.html', title: 'Smart Money Habits for Broke Students', image: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1400&q=80' },
        { url: 'everyday.html', title: '7 Everyday Habits That Quietly Destroy Your Focus', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=80' },
        { url: 'chrome-extensions.html', title: '5 Chrome Extensions to Supercharge Your Productivity', image: 'images/chrome extensions.PNG' },
        { url: 'ai-tools.html', title: '7 Free AI Tools That Can Make You Money', image: 'images/ai.jpg' },
        { url: 'chrome-tricks.html', title: '10 Hidden Chrome Tricks to Browse Like a Pro', image: 'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?auto=format&fit=crop&w=800&q=80' },
        { url: 'hidden-android.html', title: '7 Hidden Android Features You Never Knew Existed', image: 'images/android.jpg' },
        { url: 'ai-prompts.html', title: '10 AI Prompts to Work Smarter, Not Harder', image: 'https://images.unsplash.com/photo-1677756119517-756a188d2d94?auto=format&fit=crop&w=800&q=80' },
        { url: 'self-discipline.html', title: 'The Psychology of Self-Discipline', image: 'https://images.unsplash.com/photo-1557997213-3c1e7a615013?auto=format&fit=crop&w=800&q=80' },
        { url: 'start-with-intention.html', title: 'Start Your Day with Intention', image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80' },
        { url: 'rebuild-your-life.html', title: 'How to Rebuild Your Life When You Feel Lost', image: 'images/rebuild.jpg' },
        { url: 'why-youre-broke.html', title: 'Why You’re Always Broke (and How to Break the Cycle)', image: 'https://images.unsplash.com/photo-1579621970795-87f91d908377?auto=format&fit=crop&w=800&q=80' },
        { url: 'beat-procrastination.html', title: 'How to Beat Procrastination and Stay Consistent', image: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?auto=format&fit=crop&w=800&q=80' },
        { url: 'brain-boost.html', title: 'Foods, Games & Micro-Habits That Actually Boost Your Brain', image: 'https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&w=800&q=80' },
        { url: 'building-confidence.html', title: '10 Habits That Quietly Build Real Confidence', image: 'https://images.unsplash.com/photo-1534308143481-c55f00be8bd7?auto=format&fit=crop&w=800&q=80' },
        { url: 'money-mindset.html', title: 'How to Stop Being Broke: 7 Mindset Shifts', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80' },
        { url: 'powerful-habits.html', title: '7 Powerful Habits That Will Change Your Life Before 25', image: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=800&q=80' },
        { url: 'minimalism-guide.html', title: 'The Rise of Minimalism: How to Simplify Your Life', image: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80' },
        { url: 'positive-vibes.html', title: 'Surround Yourself with Positive Vibes', image: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=800&q=80' },
        { url: 'fitness-trends.html', title: 'Fitness Trends: What’s Hot in 2023?', image: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=800&q=80' },
        { url: 'power-of-consistency.html', title: 'The Power of Consistency', image: 'https://images.unsplash.com/photo-1573496529574-be85d6a60704?auto=format&fit=crop&w=800&q=80' },
        { url: 'future-of-work.html', title: 'The Future of Work: Remote vs. In-Office vs. Hybrid', image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80' },
        { url: 'games.html', title: 'Top 5 Recent Cool Games You Should Try in 2025', image: 'https://cdn2.unrealengine.com/fragpunk-is-a-hero-shooter-that-encourages-you-to-break-the-rules-3840x2160-7de7b1c41472.jpg' },
        { url: 'side-hustle-guide.html', title: '10 Smart Hustles for Nigerian Students', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80' }
    ];

    const readMoreContainer = document.getElementById('read-more-container');
    if (readMoreContainer) {
        const currentPage = window.location.pathname.split('/').pop();

        // Filter out the current page from the list of posts
        const otherPosts = allPosts.filter(post => post.url !== currentPage);

        // Shuffle the array of other posts
        const shuffledPosts = otherPosts.sort(() => 0.5 - Math.random());

        // Get the first 3 posts from the shuffled list
        const randomPosts = shuffledPosts.slice(0, 4);

        if (randomPosts.length > 0) {
            let linksHTML = '<h3>Read Next...</h3><ul>';
            randomPosts.forEach(post => {
                linksHTML += `<li><a href="${post.url}">${post.title}</a></li>`;
            });
            linksHTML += '</ul>';
            
            // Add a "View All" button
            const viewAllButton = `<a href="index.html" class="cta-button view-all-btn">View All Posts</a>`;

            readMoreContainer.innerHTML = linksHTML + viewAllButton;

            // Observer to show the container when user nears the footer
            const footer = document.querySelector('footer');
            const showContainerObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        readMoreContainer.classList.add('visible');
                    } else {
                        readMoreContainer.classList.remove('visible');
                    }
                });
            }, { rootMargin: "0px 0px -100px 0px" }); // Trigger when footer is 100px from viewport bottom

            if(footer) showContainerObserver.observe(footer);
        }
    }

    // === Related Posts Section (with images) ===
    const relatedPostsGrid = document.getElementById('related-posts-grid');
    if (relatedPostsGrid) {
        const currentPage = window.location.pathname.split('/').pop();
        const otherPosts = allPosts.filter(post => post.url !== currentPage);
        const shuffledPosts = otherPosts.sort(() => 0.5 - Math.random());
        const randomPosts = shuffledPosts.slice(0, 3);

        let relatedHTML = '';
        randomPosts.forEach(post => {
            relatedHTML += `
                <a href="${post.url}" class="related-post-card">
                    <img src="${post.image}" alt="${post.title}">
                    <div class="related-post-card-content">
                        <h4 class="related-post-card-title">${post.title}</h4>
                    </div>
                </a>
            `;
        });

        relatedPostsGrid.innerHTML = relatedHTML;
    }

    // === Back to Top Button Logic ===
    const backToTopButton = document.getElementById('back-to-top-btn');

    if (backToTopButton) {
        window.onscroll = function() {
            scrollFunction();
        };

        function scrollFunction() {
            if (document.body.scrollTop > 100 || document.documentElement.scrollTop > 100) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        }

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // === Search Functionality (Homepage only) ===
    const searchInput = document.getElementById('search-input');
    const blogGrid = document.querySelector('.blog-grid');
    const searchResultsMessage = document.getElementById('search-results-message');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const allPostsLoadedMessage = document.getElementById('all-posts-loaded-message');

    if (blogGrid) {
        const allCards = Array.from(blogGrid.querySelectorAll('.blog-card'));
        const initialVisibleCount = 15;
        const postsPerLoad = 5;
        let currentlyVisible = initialVisibleCount;

        const updateVisiblePosts = () => {
            allCards.forEach((card, index) => {
                card.style.display = index < currentlyVisible ? 'flex' : 'none';
            });

            if (loadMoreBtn) {
                if (currentlyVisible >= allCards.length) {
                    // All posts are loaded
                    loadMoreBtn.textContent = "That's all for now";
                    loadMoreBtn.disabled = true;
                    loadMoreBtn.classList.add('disabled');
                    if (allPostsLoadedMessage) allPostsLoadedMessage.style.display = 'block';
                } else {
                    loadMoreBtn.style.display = 'block';
                }
            }
        };

        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                const buttonText = loadMoreBtn.querySelector('.button-text');
                const loadingAnimationHTML = `
                    <div class="loading-animation">
                        <svg class="logo-svg" width="85" height="20" viewBox="0 0 170 40" xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <rect class="bar bar1" x="0" y="10" width="8" height="20" rx="2" fill="#fff"></rect>
                                <rect class="bar bar2" x="12" y="0" width="8" height="40" rx="2" fill="#fff"></rect>
                                <rect class="bar bar3" x="24" y="10" width="8" height="20" rx="2" fill="#fff"></rect>
                            </g>
                        </svg>
                    </div>
                `;

                loadMoreBtn.classList.add('loading');
                loadMoreBtn.insertAdjacentHTML('beforeend', loadingAnimationHTML);
                if(buttonText) buttonText.style.visibility = 'hidden';

                // Simulate network delay for a better UX
                setTimeout(() => {
                    currentlyVisible += postsPerLoad;
                    updateVisiblePosts();
                    loadMoreBtn.classList.remove('loading');
                    if(buttonText) buttonText.style.visibility = 'visible';
                    const animation = loadMoreBtn.querySelector('.loading-animation');
                    if (animation) animation.remove();
                }, 500); // 500ms delay
            });
        }

        if (searchInput) {
            const handleSearch = () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                let visibleCount = 0;

                // When searching, hide the "Load More" button
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';

                allCards.forEach(card => {
                    const title = card.querySelector('.blog-card-title').textContent.toLowerCase();
                    const excerpt = card.querySelector('.blog-card-excerpt').textContent.toLowerCase();
                    const keywords = card.dataset.keywords ? card.dataset.keywords.toLowerCase() : '';

                    if (searchTerm === '') {
                        // If search is cleared, reset to initial view
                        updateVisiblePosts();
                    } else if (title.includes(searchTerm) || excerpt.includes(searchTerm) || keywords.includes(searchTerm)) {
                        card.style.display = 'flex';
                        visibleCount++;
                    } else {
                        card.style.display = 'none';
                    }
                });

                if (visibleCount === 0 && searchTerm !== '') {
                    searchResultsMessage.textContent = `No articles found for "${searchTerm}"`;
                    searchResultsMessage.style.display = 'block';
                } else {
                    searchResultsMessage.style.display = 'none';
                }
            };
            searchInput.addEventListener('keyup', handleSearch);
        }

        // Initial load
        updateVisiblePosts();
    }

    // Apply theme on initial load
    applyTheme();

    // === PWA Service Worker Registration ===
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
        });
    }

    // === Monetag Direct Link On-Click (Blog Posts Only) ===
    function setupDirectLink() {
        const directLink = 'https://otieu.com/4/10234142';

        // This logic should only run on blog post pages.
        // We can detect a blog post page by looking for an element unique to it,
        // like the '.post-interactions' or '.comment-section'.
        const isBlogPost = document.querySelector('.post-interactions');

        if (isBlogPost) {
            // The { once: true } option ensures this event listener only runs a single time
            // per page load, so it doesn't open a new tab on every click.
            document.body.addEventListener('click', () => {
                // This opens the link in a new tab. Modern browsers may still bring
                // it to the foreground, but it's the standard way to implement this.
                window.open(directLink, '_blank');
            }, { once: true });
        }
    }
    // Initialize the direct link functionality
    setupDirectLink();

});