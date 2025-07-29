// 获取DOM元素
const bookingModal = document.getElementById('bookingModal');
const loginModal = document.getElementById('loginModal');
const closeButtons = document.querySelectorAll('.close');
const navLinks = document.querySelectorAll('.nav-link');

// 预约弹窗功能
function openBookingModal(venueName) {
    document.getElementById('venueName').value = venueName;
    bookingModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // 防止背景滚动
}

// 登录弹窗功能
function openLoginModal() {
    loginModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭弹窗功能
function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto'; // 恢复背景滚动
}

// 关闭按钮事件监听
closeButtons.forEach(button => {
    button.addEventListener('click', function() {
        const modal = this.closest('.modal');
        closeModal(modal);
    });
});

// 点击弹窗外部关闭
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target);
    }
});

// 导航链接点击事件
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        // 移除所有active类
        navLinks.forEach(l => l.classList.remove('active'));
        // 添加active类到当前点击的链接
        this.classList.add('active');
        
        // 如果是登录按钮，打开登录弹窗
        if (this.classList.contains('login-btn')) {
            e.preventDefault();
            openLoginModal();
        }
    });
});

// 预约表单提交
document.getElementById('bookingForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // 获取表单数据
    const formData = {
        venueName: document.getElementById('venueName').value,
        bookingDate: document.getElementById('bookingDate').value,
        startTime: document.getElementById('startTime').value,
        endTime: document.getElementById('endTime').value,
        userName: document.getElementById('userName').value,
        userPhone: document.getElementById('userPhone').value
    };
    
    // 简单的表单验证
    if (!formData.bookingDate || !formData.startTime || !formData.endTime || 
        !formData.userName || !formData.userPhone) {
        alert('请填写所有必填字段！');
        return;
    }
    
    // 检查时间逻辑
    if (formData.startTime >= formData.endTime) {
        alert('结束时间必须晚于开始时间！');
        return;
    }
    
    // 模拟提交预约
    console.log('预约信息：', formData);
    alert('预约提交成功！我们会尽快确认您的预约。');
    
    // 关闭弹窗并重置表单
    closeModal(bookingModal);
    this.reset();
});

// 登录表单提交
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('请输入用户名和密码！');
        return;
    }
    
    // 模拟登录
    console.log('登录信息：', { username, password });
    alert('登录成功！');
    
    // 关闭弹窗并重置表单
    closeModal(loginModal);
    this.reset();
    
    // 更新导航栏显示
    updateNavAfterLogin();
});

// 注册功能
function showRegister() {
    alert('注册功能开发中...');
}

// 取消预约功能
document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        if (confirm('确定要取消这个预约吗？')) {
            // 模拟取消预约
            const bookingItem = this.closest('.booking-item');
            bookingItem.style.opacity = '0.5';
            this.textContent = '已取消';
            this.disabled = true;
            alert('预约已取消！');
        }
    });
});

// 登录后更新导航栏
function updateNavAfterLogin() {
    const loginBtn = document.querySelector('.login-btn');
    loginBtn.textContent = '我的账户';
    loginBtn.classList.remove('login-btn');
    loginBtn.classList.add('user-btn');
}

// 立即预约按钮点击事件
document.querySelector('.cta-button').addEventListener('click', function() {
    // 滚动到场馆区域
    document.getElementById('venues').scrollIntoView({ 
        behavior: 'smooth' 
    });
});

// 平滑滚动到锚点
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// 设置最小日期为今天
const today = new Date().toISOString().split('T')[0];
document.getElementById('bookingDate').setAttribute('min', today);

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('体育场馆预约系统已加载完成！');
    
    // 添加一些动画效果
    const venueCards = document.querySelectorAll('.venue-card');
    venueCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('fade-in');
    });
    
    // 初始化搜索和筛选功能
    initSearchAndFilter();
    
    // 初始化排序功能
    initSorting();
    
    // 初始化个人中心功能
    initProfileFeatures();
});

// 搜索和筛选功能
function initSearchAndFilter() {
    const searchInput = document.getElementById('searchInput');
    const sportType = document.getElementById('sportType');
    const distance = document.getElementById('distance');
    const price = document.getElementById('price');
    const time = document.getElementById('time');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', filterVenues);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', filterVenues);
    }
    
    if (sportType) {
        sportType.addEventListener('change', filterVenues);
    }
    
    if (distance) {
        distance.addEventListener('change', filterVenues);
    }
    
    if (price) {
        price.addEventListener('change', filterVenues);
    }
    
    if (time) {
        time.addEventListener('change', filterVenues);
    }
}

function filterVenues() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    const selectedSport = document.getElementById('sportType')?.value;
    const selectedDistance = document.getElementById('distance')?.value;
    const selectedPrice = document.getElementById('price')?.value;
    const selectedTime = document.getElementById('time')?.value;
    
    const venueCards = document.querySelectorAll('.venue-card');
    
    venueCards.forEach(card => {
        let show = true;
        
        // 搜索过滤
        if (searchTerm) {
            const venueName = card.querySelector('h3').textContent.toLowerCase();
            const venueDesc = card.querySelector('.venue-description').textContent.toLowerCase();
            if (!venueName.includes(searchTerm) && !venueDesc.includes(searchTerm)) {
                show = false;
            }
        }
        
        // 运动类型过滤
        if (selectedSport && card.dataset.sport !== selectedSport) {
            show = false;
        }
        
        // 距离过滤
        if (selectedDistance && parseFloat(card.dataset.distance) > parseFloat(selectedDistance)) {
            show = false;
        }
        
        // 价格过滤
        if (selectedPrice) {
            const venuePrice = parseFloat(card.dataset.price);
            const [minPrice, maxPrice] = selectedPrice.split('-').map(p => p === '+' ? Infinity : parseFloat(p));
            if (venuePrice < minPrice || venuePrice > maxPrice) {
                show = false;
            }
        }
        
        // 显示或隐藏卡片
        card.style.display = show ? 'block' : 'none';
    });
}

// 排序功能
function initSorting() {
    const sortBtns = document.querySelectorAll('.sort-btn');
    
    sortBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有active类
            sortBtns.forEach(b => b.classList.remove('active'));
            // 添加active类到当前按钮
            this.classList.add('active');
            
            const sortType = this.dataset.sort;
            sortVenues(sortType);
        });
    });
}

function sortVenues(sortType) {
    const venuesGrid = document.querySelector('.venues-grid');
    const venueCards = Array.from(document.querySelectorAll('.venue-card'));
    
    venueCards.sort((a, b) => {
        let aValue, bValue;
        
        switch(sortType) {
            case 'distance':
                aValue = parseFloat(a.dataset.distance);
                bValue = parseFloat(b.dataset.distance);
                return aValue - bValue;
            case 'price':
                aValue = parseFloat(a.dataset.price);
                bValue = parseFloat(b.dataset.price);
                return aValue - bValue;
            case 'rating':
                aValue = parseFloat(a.dataset.rating);
                bValue = parseFloat(b.dataset.rating);
                return bValue - aValue;
            default:
                return 0;
        }
    });
    
    // 重新排列DOM元素
    venueCards.forEach(card => {
        venuesGrid.appendChild(card);
    });
}

// 个人中心功能
function initProfileFeatures() {
    // 反馈表单提交
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = {
                type: document.getElementById('feedbackType').value,
                title: document.getElementById('feedbackTitle').value,
                content: document.getElementById('feedbackContent').value,
                contact: document.getElementById('contactInfo').value
            };
            
            console.log('反馈信息：', formData);
            alert('感谢您的反馈！我们会尽快处理。');
            this.reset();
        });
    }
    
    // 设置保存按钮
    const saveBtns = document.querySelectorAll('.save-btn');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('设置已保存！');
        });
    });
    
    // 修改密码按钮
    const changePasswordBtn = document.querySelector('.change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            alert('修改密码功能开发中...');
        });
    }
    
    // 退出登录按钮
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                alert('已退出登录');
                window.location.href = 'index.html';
            }
        });
    }
    
    // VIP套餐按钮
    const planBtns = document.querySelectorAll('.plan-btn');
    planBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            alert('VIP套餐购买功能开发中...');
        });
    });
    
    // 升级和续费按钮
    const upgradeBtn = document.querySelector('.upgrade-btn');
    const renewBtn = document.querySelector('.renew-btn');
    
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', function() {
            alert('会员升级功能开发中...');
        });
    }
    
    if (renewBtn) {
        renewBtn.addEventListener('click', function() {
            alert('会员续费功能开发中...');
        });
    }
}

// 显示不同区域的功能
function showSection(sectionName) {
    // 隐藏所有内容区域
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    
    // 显示选中的区域
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
}

// 添加CSS动画类
const style = document.createElement('style');
style.textContent = `
    .fade-in {
        animation: fadeInUp 0.6s ease-out forwards;
        opacity: 0;
        transform: translateY(30px);
    }
    
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .venue-card:hover {
        transform: translateY(-10px) scale(1.02);
    }
    
    .book-btn:active {
        transform: translateY(0);
    }
    
    .submit-btn:active {
        transform: translateY(0);
    }
`;
document.head.appendChild(style); 