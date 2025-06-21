let db;
let markerId;

document.addEventListener('DOMContentLoaded', () => {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyBuHHTyO2ZXILBRQQdlMlZfULeHZr-8AvA",
    authDomain: "dsfsdfdsf-3c8a5.firebaseapp.com",
    databaseURL: "https://dsfsdfdsf-3c8a5-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "dsfsdfdsf-3c8a5",
    storageBucket: "dsfsdfdsf-3c8a5.appspot.com",
    messagingSenderId: "411721034812",
    appId: "1:411721034812:web:1f2a264f09113ee9ede739"
  };

  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();

  // Get markerId
  markerId = localStorage.getItem('markerId');
  if (!markerId) {
    alert("Không tìm thấy thông tin nhà trọ!");
    return;
  }

  // Load data and comments
  db.ref(`manualLocations/${markerId}`).once('value')
    .then(snapshot => {
      const data = snapshot.val();
      if (data) {
        displayData(data);
        loadComments();
      } else {
        alert("Không có dữ liệu cho nhà trọ này!");
      }
    })
    .catch(err => {
      console.error(err);
      alert("Lỗi khi tải dữ liệu nhà trọ!");
    });
});

function displayData(data) {
  const name = data.name || 'Không có';
  const icon = data.icon || '🏠';
  const imageUrl = data.imageUrl || 'https://via.placeholder.com/600x300';
  const image1 = data.image1 || 'https://via.placeholder.com/100x80';
  const image2 = data.image2 || 'https://via.placeholder.com/100x80';
  const diachi = data.diachi || '';
  const gmail = data.gmail || '';
  const gianha = data.gianha || '';
  const node = data.node || '';
  const sdt = data.sdt || '#';

  // Gán dữ liệu
  document.getElementById('Hi').innerHTML = `<p>${icon} Tên nhà trọ: ${name}</p>`;
  document.getElementById('Hi1').src = imageUrl;
  document.getElementById('Hi2').src = image1;
  document.getElementById('Hi3').src = image2;
  document.getElementById('diachi').innerHTML = `<p><strong>Địa chỉ:</strong> ${diachi}</p>`;
  document.getElementById('gmail').innerHTML = `<p><strong>Gmail:</strong> ${gmail}</p>`;
  document.getElementById('gianha').innerHTML = `<p><strong>Giá thuê:</strong> ${gianha}</p>`;
  document.getElementById('node').innerHTML = node;
  document.getElementById('sdt').href = sdt;
  document.getElementById('sdt').innerHTML = `📞 ${sdt}`;
}

// Gửi bình luận
function sendComment() {
  const nickname = document.getElementById("nickname").value.trim();
  const comment = document.getElementById("comment").value.trim();

  if (!nickname || !comment) {
    alert("Vui lòng nhập đầy đủ nickname và bình luận.");
    return;
  }

  const commentData = {
    nickname,
    comment,
    timestamp: Date.now()
  };

  db.ref(`manualLocations/${markerId}/comments`).push(commentData)
    .then(() => {
      document.getElementById("nickname").value = "";
      document.getElementById("comment").value = "";
      loadComments();
    })
    .catch(err => {
      console.error("Lỗi khi gửi bình luận:", err);
      alert("Không thể gửi bình luận!");
    });
}

// Tải bình luận
function loadComments() {
  const commentList = document.getElementById("commentList");
  commentList.innerHTML = "<p>Đang tải bình luận...</p>";

  db.ref(`manualLocations/${markerId}/comments`).once('value')
    .then(snapshot => {
      commentList.innerHTML = "";
      const comments = snapshot.val();

      if (comments) {
        Object.values(comments).forEach(c => {
          const div = document.createElement("div");
          div.className = "comment-box";
          const time = new Date(c.timestamp).toLocaleString('vi-VN');
          div.innerHTML = `<strong>${c.nickname}</strong> <small style="color:gray;">(${time})</small><br>${c.comment}`;
          commentList.appendChild(div);
        });
      } else {
        commentList.innerHTML = "<p>Chưa có bình luận nào.</p>";
      }
    })
    .catch(err => {
      console.error("Lỗi khi tải bình luận:", err);
      commentList.innerHTML = "<p>Lỗi khi tải bình luận.</p>";
    });
}
