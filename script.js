class FirebaseManager {
  constructor() {
    this.firebaseConfig = {
  apiKey: "AIzaSyBuHHTyO2ZXILBRQQdlMlZfULeHZr-8AvA",
  authDomain: "dsfsdfdsf-3c8a5.firebaseapp.com",
  databaseURL: "https://dsfsdfdsf-3c8a5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dsfsdfdsf-3c8a5",
  storageBucket: "dsfsdfdsf-3c8a5.firebasestorage.app",
  messagingSenderId: "411721034812",
  appId: "1:411721034812:web:1f2a264f09113ee9ede739",
  measurementId: "G-HL6R0RZ1J0"

    };
    firebase.initializeApp(this.firebaseConfig);
    this.db = firebase.database();
  }

  sendUserLocation(userId, userName, userColor, latlng) {
    if (!userId) return;
    this.db.ref('users/' + userId).set({
      name: userName,
      color: userColor,
      lat: latlng[0],
      lng: latlng[1],
      timestamp: Date.now()
    }).catch(err => console.error("Lỗi khi gửi vị trí người dùng:", err));
  }

  saveManualLocation(markerId, data) {
    return this.db.ref(`manualLocations/${markerId}`).set(data)
      .catch(err => {
        throw new Error("Lỗi khi lưu vị trí thủ công: " + err.message);
      });
  }
}

class MapManager {
  constructor() {
    this.map = null;
    this.allMarkers = {};
    this.currentRoute = null;
    this.userLocation = null;
    this.graphhopperApiKey = '815be129-74bb-454d-ae8f-71ed02a35a8c';
  }

  initMap(userName, userColor, onLocationUpdate) {
    const defaultLatLng = [21.012864, 105.525227];
    // Set minZoom in L.map options to restrict zooming out
    this.map = L.map('map', {
        minZoom: 12 // Adjust this value to limit how far users can zoom out
    }).setView(defaultLatLng, 19);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 12 // You can also set minZoom here for consistency
    }).addTo(this.map);

    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const latlng = [position.coords.latitude, position.coords.longitude];
                this.userLocation = latlng;

                const icon = L.divIcon({
                    className: '',
                    html: `<div style="background:${userColor};width:16px;height:16px;border-radius:50%;border:2px solid white;"></div>`,
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                });

                if (!window.marker) {
                    window.marker = L.marker(latlng, { icon }).addTo(this.map).bindPopup(userName).openPopup();
                    this.map.setView(latlng, 15);
                } else {
                    window.marker.setLatLng(latlng);
                }

          document.getElementById('coordinates').innerText =
            `Latitude: ${latlng[0].toFixed(6)}, Longitude: ${latlng[1].toFixed(6)}`;
          localStorage.setItem("coordinates", `Latitude: ${latlng[0].toFixed(6)}, Longitude: ${latlng[1].toFixed(6)}`);

          onLocationUpdate(latlng);
        },
        (error) => {
          let message = "Không thể lấy vị trí.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Bạn đã từ chối chia sẻ vị trí. Vui lòng bật quyền truy cập vị trí trong trình duyệt.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Thông tin vị trí không khả dụng.";
              break;
            case error.TIMEOUT:
              message = "Hết thời gian lấy vị trí.";
              break;
          }
          alert(message);
          this.userLocation = defaultLatLng;
          this.map.setView(defaultLatLng, 15);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 20000
        }
      );
    } else {
      alert("Trình duyệt không hỗ trợ định vị.");
      this.userLocation = defaultLatLng;
      this.map.setView(defaultLatLng, 15);
    }
  }

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return (distance / 1000).toFixed(2);
  }

  showRoute(lat, lng) {
    if (!this.userLocation) {
      alert("Không thể xác định vị trí của bạn!");
      return;
    }

    if (this.currentRoute) {
      this.map.removeLayer(this.currentRoute);
    }

    const graphhopperUrl = `https://graphhopper.com/api/1/route?point=${this.userLocation[0]},${this.userLocation[1]}&point=${lat},${lng}&vehicle=foot&locale=vi&key=${this.graphhopperApiKey}&type=json&points_encoded=false`;

    fetch(graphhopperUrl)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return response.json();
      })
      .then(data => {
        if (!data.paths || data.paths.length === 0) {
          alert("Không thể tìm đường đi đến vị trí này!");
          return;
        }

        const routeCoordinates = data.paths[0].points.coordinates.map(coord => [coord[1], coord[0]]);
        this.currentRoute = L.polyline(routeCoordinates, {
          color: 'blue',
          weight: 4,
          opacity: 0.7
        }).addTo(this.map);

        const bounds = L.latLngBounds(routeCoordinates);
        this.map.fitBounds(bounds, { padding: [50, 50] });
      })
      .catch(error => {
        console.error('Lỗi khi lấy đường đi:', error);
        alert("Đã xảy ra lỗi khi tìm đường đi bộ: " + error.message);
      });
  }

  loadAllMarkers(firebaseManager, updateLocationList) {
    firebaseManager.db.ref('manualLocations').on('value', (snapshot) => {
      const markers = snapshot.val();
      for (const id in this.allMarkers) {
        if (id.startsWith('manual_')) {
          this.map.removeLayer(this.allMarkers[id]);
          delete this.allMarkers[id];
        }
      }

      if (markers) {
        for (const id in markers) {
          const m = markers[id];
          const latlng = [m.lat, m.lng];
          const icon = L.divIcon({
            className: '',
            html: `<div style="font-size:20px;color:${m.color};">${m.icon}</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });
          const popupContent = `
            <div>
              <strong><h1>${m.icon} ${m.name}</h1></strong><br>
              <strong>Giá điện:</strong> ${m.price ? m.price.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa có giá'}<br>
              <strong>Đánh giá:</strong> ${'★'.repeat(Math.round(m.rating || 0))}${'☆'.repeat(5 - Math.round(m.rating || 0))}<br>
              <a href="${m.map}">Googlemap</a>
              <img src="${m.imageUrl}" alt="${m.name}" style="max-width: 60%; height: auto;"><br>
                        
              <button onclick="reloadandnew1('${id}')">Thông tin trọ:</button>
            </div>
          `;
          const marker = L.marker(latlng, { icon }).addTo(this.map).bindPopup(popupContent);
          marker.on('click', () => {
            this.editManualMarker(id, m.lat, m.lng, m.name, m.color, m.icon, m.imageUrl, m.rating, m.price);
          });
          this.allMarkers['manual_' + id] = marker;
        }
      }
      updateLocationList();
    });
  }
}

class UserLocationManager extends MapManager {
  constructor() {
    super();
    this.userName = "";
    this.userColor = "#ff0000";
    this.userId = null;
    this.firebaseManager = new FirebaseManager();
  }

  saveUserInfo() {
    const nameInput = document.getElementById("userName").value.trim();
    const colorInput = document.getElementById("colorPicker").value;

    if (nameInput === "") {
      alert("Vui lòng nhập tên!");
      return;
    }

    this.userName = nameInput;
    this.userColor = colorInput;
    this.userId = this.generateUserId();

    document.getElementById("overlay").style.display = "none";
    this.initMap(this.userName, this.userColor, (latlng) => {
      this.firebaseManager.sendUserLocation(this.userId, this.userName, this.userColor, latlng);
      this.updateLocationList();
    });

    window.addEventListener("beforeunload", () => {
      if (this.userId) {
        this.firebaseManager.db.ref('users/' + this.userId).remove();
      }
    });

    this.loadAllMarkers(this.firebaseManager, () => this.updateLocationList());
  }

  generateUserId() {
    return this.userName + "_" + Date.now();
  }

  updateLocationList() {
  const locationList = document.getElementById('locationList');
  const sortOrder = document.getElementById('sortOrder').value;
  const sortType = document.getElementById('sortType').value;
  const searchQuery = document.getElementById('search-input').value.trim().toLowerCase(); // Lấy từ khóa tìm kiếm
  locationList.innerHTML = '';

  this.firebaseManager.db.ref('manualLocations').once('value', (snapshot) => {
    const markers = snapshot.val();
    if (!markers) return;

    let locations = [];
    for (const id in markers) {
      const m = markers[id];
      const distance = this.userLocation ? this.calculateDistance(this.userLocation[0], this.userLocation[1], m.lat, m.lng) : 'N/A';
      // Chỉ thêm vị trí nếu tên chứa từ khóa tìm kiếm
      if (m.name.toLowerCase().includes(searchQuery)) {
        locations.push({ id, ...m, distance });
      }
    }

    // Sắp xếp danh sách// quan trọng
    if (sortType === 'distance' && sortOrder === 'asc') {
      locations.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    } else if (sortType === 'distance' && sortOrder === 'desc') {
      locations.sort((a, b) => parseFloat(b.distance) - parseFloat(a.distance));
    } else if (sortType === 'price' && sortOrder === 'asc') {
      locations.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
    } else if (sortType === 'price' && sortOrder === 'desc') {
      locations.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
    } else {
      // Ngẫu nhiên (khi sortType hoặc sortOrder không hợp lệ)
      for (let i = locations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [locations[i], locations[j]] = [locations[j], locations[i]];
      }
    }

    // Hiển thị danh sách
    locations.forEach(loc => {
      const div = document.createElement('div');
      div.className = 'location-item';
      div.innerHTML = `
        <span>${loc.icon} ${loc.name}</span>
        <span>${loc.price ? loc.price.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa có giá'}</span>
        <span>${loc.distance ? loc.distance + ' km' : 'N/A'}</span>
        <span>${'★'.repeat(Math.round(loc.rating || 0))}${'☆'.repeat(5 - Math.round(loc.rating || 0))}</span>
        <button class="directions-btn" onclick="userLocationManager.showRoute(${loc.lat}, ${loc.lng})">Xác định</button>
      `;
      locationList.appendChild(div);
    });
  });
}

  addManualMarker() {
    const lat = parseFloat(document.getElementById("manualLat").value);
    const lng = parseFloat(document.getElementById("manualLng").value);
    const name = document.getElementById("manualName").value.trim();
    const color = document.getElementById("manualColor").value;
    const iconSymbol = document.getElementById("manualIcon").value;
    const imageUrl = document.getElementById("manualImageUrl").value.trim();
    const map = document.getElementById("manualMapLink").value.trim();
    const image1 = document.getElementById("manualImageUrl1").value.trim();
    const image2 = document.getElementById("manualImageUrl2").value.trim();
    const rating = parseInt(document.querySelector('#manualRating .star.selected:last-child')?.dataset.value || 0);
    const price = parseInt(document.getElementById("manualPrice").value) || 0;
    const comment = document.getElementById("manualcomment").value.trim();
    const nickname = document.getElementById("manualnickname").value.trim();
    const diachi=document.getElementById("manualImageUrl1").value.trim();//////
    const gmail=document.getElementById("manualImageUrl1").value.trim();
    const sdt=document.getElementById("manualImageUrl1").value.trim();
    const gianha=document.getElementById("manualImageUrl1").value.trim();
    const node=document.getElementById("manualImageUrl1").value.trim();
    if (isNaN(lat) || isNaN(lng) || name === "" || imageUrl === ""){
      alert("Vui lòng nhập đầy đủ và chính xác thông tin, bao gồm URL ảnh!");
      return;
    }
    if (!this.userId) {
      alert("Vui lòng nhập tên người dùng trước khi thêm vị trí!");
      return;
    }

    const latlng = [lat, lng];
    const icon = L.divIcon({
      className: '',
      html: `<div style="font-size:20px;color:${color};">${iconSymbol}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    L.marker(latlng, { icon }).addTo(this.map).bindPopup(`${iconSymbol} ${name}`).openPopup();

    const manualMarkerId = name + "_" + Date.now();
    const manualsubject = name + "_";
    this.firebaseManager.saveManualLocation(manualMarkerId, {
      name: name,
      color: color,
      icon: iconSymbol,
      lat: lat,
      lng: lng,
      imageUrl: imageUrl,
      rating: rating,
      timestamp: Date.now(),
      isManual: true,
      price: price,
      map: map,
      image1: image1,
    image2: image2,
    diachi: diachi,/////
    gmail: gmail,
    gianha: gianha,
    sdt: sdt,
    node: node
    }).then(() => {   
      this.toggleManualForm();
      document.getElementById("manualLat").value = "";
      document.getElementById("manualLng").value = "";
      document.getElementById("manualName").value = "";
      document.getElementById("manualImageUrl").value = "";
      document.getElementById("manualPrice").value = "";
      document.getElementById("manualMapLink").value="";
      document.getElementById("manualImageUrl1").value="";
      document.getElementById("manualImageUrl2").value="";
      document.getElementById("manualcomment").value="";
      document.getElementById("manualnickname").value="";
      document.querySelectorAll('#manualRating .star').forEach(star => star.classList.remove('selected'));
      this.updateLocationList();
    }).catch(err => {
      alert(err.message);
    });
  }

  editManualMarker(markerId, lat, lng, name, color, iconSymbol, imageUrl, rating, price, map, image1, image2, comment, nickname) {
    document.getElementById("addManualForm").style.display = "none";
    document.getElementById("editManualForm").style.display = "block";
    document.getElementById("manualFormPopup").style.display = "block";
    document.getElementById("editManualId").value = markerId;
    document.getElementById("editManualLat").value = lat;
    document.getElementById("editManualLng").value = lng;
    document.getElementById("editManualMapLink").value= map;
    document.getElementById("editManualImageUrl1").value=image1;
   document.getElementById("editManualImageUrl2").value=image2;
    document.getElementById("editManualName").value = name;
    document.getElementById("editManualColor").value = color;
    document.getElementById("editManualIcon").value = iconSymbol;
    document.getElementById("editManualImageUrl").value = imageUrl || "";
    document.getElementById("editManualPrice").value = price || 0;

    const editImagePreview = document.getElementById("editImagePreview");
    editImagePreview.innerHTML = "";
    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "Ảnh minh họa";
      img.style.maxWidth = "100px";
      img.style.maxHeight = "100px";
      img.style.border = "1px solid #ccc";
      img.style.borderRadius = "5px";
      img.style.objectFit = "cover";
      editImagePreview.appendChild(img);
    }
    document.querySelectorAll('#editManualRating .star').forEach(star => {
      star.classList.remove('selected');
      if (parseInt(star.dataset.value) <= rating) {
        star.classList.add('selected');
      }
    });
  }

  saveEditedMarker() {
    const markerId = document.getElementById("editManualId").value;
    const lat = parseFloat(document.getElementById("editManualLat").value);
    const lng = parseFloat(document.getElementById("editManualLng").value);
    const name = document.getElementById("editManualName").value.trim();
    const color = document.getElementById("editManualColor").value;
    const iconSymbol = document.getElementById("editManualIcon").value;
    const imageUrl = document.getElementById("editManualImageUrl").value.trim();
    const rating = parseInt(document.querySelector('#editManualRating .star.selected:last-child')?.dataset.value || 0);
    const price = parseInt(document.getElementById("editManualPrice").value) || 0;
    const map = document.getElementById("editManualMapLink").value.trim();
    const image1=document.getElementById("editManualImageUrl1").value.trim();
    const image2=document.getElementById("editManualImageUrl2").value.trim();
    const comment = document.getElementById("editManualcomment").value.trim();
    const nickname = document.getElementById("editManualnickname").value.trim();
    
    if (isNaN(lat) || isNaN(lng) || name === "" || imageUrl === "") {
      alert("Vui lòng nhập đầy đủ và chính xác thông tin, bao gồm URL ảnh!");
      return;
    }

    this.firebaseManager.saveManualLocation(markerId, {
     name: name,
     color: color,
      icon: iconSymbol,
      lat: lat,
      lng: lng,
      rating: rating,
      timestamp: Date.now(),
      isManual: true,
      price: price,
      map: map,
      image1: image1,
      image2: image2
      
    }).then(() => {
        
        if (comment) {
            const commentData = {
                comment: comment,
                nickname: nickname || "Ẩn danh",
                timestamp: Date.now()
            };
            this.firebaseManager.db.ref(`manualLocations/${markerId}/comments`).push(commentData);
        }
        
      document.getElementById("editManualForm").style.display = "none";
      document.getElementById("manualFormPopup").style.display = "none";
      this.updateLocationList();
    }).catch(err => {
      alert(err.message);
    });
  }

  toggleManualForm() {
    const form = document.getElementById("manualFormPopup");
    const addForm = document.getElementById("addManualForm");
    const editForm = document.getElementById("editManualForm");
    if (form.style.display === "none" || form.style.display === "") {
      form.style.display = "block";
      addForm.style.display = "block";
      editForm.style.display = "none";
    } else {
      form.style.display = "none";
      addForm.style.display = "block";
      editForm.style.display = "none";
    }
  }
}

const userLocationManager = new UserLocationManager();

function clearAllUsers() {
  if (confirm("Bạn có chắc muốn xóa toàn bộ dữ liệu người dùng không?")) {
    userLocationManager.firebaseManager.db.ref("users").remove()
      .then(() => {
        alert("Đã xóa tất cả người dùng!");
        location.reload();
      })
      .catch(err => alert("Lỗi: " + err.message));
  }
}

function toggleFilterMenu() {
  const filterMenu = document.getElementById('filterMenu');
  filterMenu.style.display = filterMenu.style.display === 'none' ? 'block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('#addManualForm .star, #editManualForm .star').forEach(star => {
    star.addEventListener('click', () => {
      const value = parseInt(star.dataset.value);
      const siblings = star.parentElement.querySelectorAll('.star');
      siblings.forEach(s => {
        s.classList.remove('selected');
        if (parseInt(s.dataset.value) <= value) {
          s.classList.add('selected');
        }
      });
    });
  });
  document.getElementById('sortType').addEventListener('change', () => userLocationManager.updateLocationList());
  document.getElementById('sortOrder').addEventListener('change', () => userLocationManager.updateLocationList());
    document.getElementById('search-input').addEventListener('input', () => userLocationManager.updateLocationList());
  const divider = document.getElementById("divider");
  const sidebar1 = document.getElementById("sidebar1");
  const sidebar2 = document.getElementById("sidebar2");

  divider.addEventListener("mousedown", function (e) {
    document.addEventListener("mousemove", resize);
    document.addEventListener("mouseup", function () {
      document.removeEventListener("mousemove", resize);
    });
  });

  function resize(e) {
    let containerWidth = document.querySelector(".container").offsetWidth;
    let newWidth = e.clientX;
    sidebar1.style.width = newWidth + "px";
    sidebar2.style.width = (containerWidth - newWidth - 10) + "px";
  }
});

window.onload = function() {
  const coordinates = localStorage.getItem("coordinates") || "Chưa chọn";
  document.getElementById("coordinates").textContent = coordinates;
};
//ảnh hiện thị

let isVisible = false;   

  document.getElementById("hello").addEventListener("click", () => {
    isVisible = !isVisible;
     document.getElementById("div2").style.display = isVisible ? "block" : "none";
     });
  document.getElementById("hi").addEventListener("click",()=>{
    isVisible=!isVisible;
    document.getElementById("manualFormPopup").style.display= isVisible?"block":"none";
    });
    function opendiv2(){
  const filterMenu = document.getElementById('dev22');
  filterMenu.style.display = filterMenu.style.display === 'none' ? 'block' : 'none';
}

function reloadandnew1(markerId) {
   console.log("Marker ID được truyền:", markerId); // Debug
    localStorage.setItem('markerId', markerId); // Chỉ lưu markerId
    window.location.href = 'info.html';
}

        // Khôi phục trạng thái khi tải trang
       window.onload = function() {
         const coordinates = localStorage.getItem("coordinates") || "Chưa chọn";
           document.getElementById("coordinates").textContent = coordinates;
    }