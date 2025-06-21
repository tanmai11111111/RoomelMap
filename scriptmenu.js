function toggleMenu() {
      const menu = document.getElementById('mobile-menu');
      menu.classList.toggle('hidden');
    }

    // Banner Carousel
    let currentBannerSlide = 0;
    const bannerSlides = document.querySelectorAll('.banner-item');
    const totalBannerSlides = bannerSlides.length;

    function moveBannerSlide(direction) {
      currentBannerSlide = (currentBannerSlide + direction + totalBannerSlides) % totalBannerSlides;
      const bannerInner = document.getElementById('banner-inner');
      bannerInner.style.transform = `translateX(-${currentBannerSlide * 100}%)`;
    }

    // Auto slide banner every 5 seconds
    setInterval(() => moveBannerSlide(1), 5000);

    // Product Carousel
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-item');
    const totalSlides = slides.length;

    function moveSlide(direction) {
      currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
      const carouselInner = document.getElementById('carousel-inner');
      carouselInner.style.transform = `translateX(-${currentSlide * 100}%)`;
    }

    // Auto slide product carousel every 5 seconds
    setInterval(() => moveSlide(1), 5000);
    function reloadandnew(){
        window.location.href = 'example.html';
        clearAllUsers();
            // Chuyển hướng
        }

        // Khôi phục trạng thái khi tải trang
        window.onload = function() {
            const coordinates = localStorage.getItem("coordinates") || "Chưa chọn";
            document.getElementById("coordinates").textContent = coordinates;
    }
    