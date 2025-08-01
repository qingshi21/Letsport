// 获取DOM元素
const bookingModal = document.getElementById('bookingModal');
const loginModal = document.getElementById('loginModal');
const closeButtons = document.querySelectorAll('.close');
const navLinks = document.querySelectorAll('.nav-link');

// 用户认证状态管理
let currentUser = null;

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', async function() {
    console.log('体育场馆预约系统已加载完成！');
    
    // 检查用户登录状态
    await checkAuthStatus();
    
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
    
    // 加载热门场馆数据
    await loadFeaturedVenues();
});

// 检查用户认证状态
async function checkAuthStatus() {
    if (API.utils.isLoggedIn()) {
        try {
            const response = await API.auth.getCurrentUser();
            currentUser = response.data;
            updateNavAfterLogin();
        } catch (error) {
            console.error('获取用户信息失败:', error);
            // 只有在token无效时才清除
            if (error.message.includes('无效的访问令牌') || error.message.includes('访问令牌已过期')) {
                API.utils.clearToken();
            }
        }
    }
}

// 预约弹窗功能
function openBookingModal(venueName, venueId = null) {
    if (!API.utils.isLoggedIn()) {
        alert('请先登录后再进行预约！');
        openLoginModal();
        return;
    }
    
    document.getElementById('venueName').value = venueName;
    if (venueId) {
        document.getElementById('venueId').value = venueId;
    }
    bookingModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 登录弹窗功能
function openLoginModal() {
    loginModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // 确保输入框可以正常交互
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    
    if (usernameInput) {
        usernameInput.focus();
        // 清除之前的事件监听器
        usernameInput.replaceWith(usernameInput.cloneNode(true));
        const newUsernameInput = document.getElementById('username');
        newUsernameInput.focus();
    }
    
    if (passwordInput) {
        // 清除之前的事件监听器
        passwordInput.replaceWith(passwordInput.cloneNode(true));
    }
    
    console.log('登录模态框已打开，输入框应该可以正常交互');
}

// 关闭弹窗功能
function closeModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
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

// 确保登录按钮可以点击
document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.querySelector('.login-btn');
    if (loginBtn) {
        // 移除可能存在的旧事件监听器
        loginBtn.removeEventListener('click', openLoginModal);
        // 添加新的事件监听器
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('登录按钮被点击');
            openLoginModal();
        });
        console.log('登录按钮事件监听器已绑定');
        
        // 确保按钮可以点击
        loginBtn.style.cursor = 'pointer';
        loginBtn.style.pointerEvents = 'auto';
    } else {
        console.error('未找到登录按钮');
    }
});

// 初始化日期选择器
document.addEventListener('DOMContentLoaded', function() {
    const bookingDateInput = document.getElementById('bookingDate');
    if (bookingDateInput) {
        // 设置最小日期为今天
        const today = new Date();
        const minDate = today.toISOString().split('T')[0];
        
        // 添加日期选择器功能
        bookingDateInput.addEventListener('focus', function() {
            if (!this.value) {
                // 设置默认日期为明天
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                this.value = tomorrow.toISOString().split('T')[0];
            }
        });
        
        // 格式化日期显示
        bookingDateInput.addEventListener('change', function() {
            if (this.value) {
                const date = new Date(this.value);
                const formattedDate = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
                this.setAttribute('data-formatted', formattedDate);
            }
        });
    }
});

// 预约表单提交
document.getElementById('bookingForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 获取表单数据
    const formData = {
        venue_id: parseInt(document.getElementById('venueId').value),
        booking_date: document.getElementById('bookingDate').value,
        start_time: document.getElementById('startTime').value + ':00',
        end_time: document.getElementById('endTime').value + ':00',
        notes: document.getElementById('bookingNotes')?.value || ''
    };
    
    // 简单的表单验证
    if (!formData.booking_date || !formData.start_time || !formData.end_time) {
        API.utils.showError('请填写所有必填字段！');
        return;
    }
    
    // 检查时间逻辑
    if (formData.start_time >= formData.end_time) {
        API.utils.showError('结束时间必须晚于开始时间！');
        return;
    }
    
    try {
        // 调用API创建预约
        const response = await API.bookings.createBooking(formData);
        API.utils.showSuccess('预约提交成功！我们会尽快确认您的预约。');
        
        // 关闭弹窗并重置表单
        closeModal(bookingModal);
        this.reset();
    } catch (error) {
        API.utils.showError(error.message || '预约提交失败，请重试！');
    }
});

// 登录表单提交
document.getElementById('loginForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        API.utils.showError('请输入用户名和密码！');
        return;
    }
    
    try {
        // 调用API登录
        const response = await API.auth.login({ username, password });
        
        // 保存token
        API.utils.saveToken(response.data.token);
        currentUser = response.data.user;
        
        API.utils.showSuccess('登录成功！');
        
        // 关闭弹窗并重置表单
        closeModal(loginModal);
        this.reset();
        
        // 更新导航栏显示
        updateNavAfterLogin();
    } catch (error) {
        API.utils.showError(error.message || '登录失败，请检查用户名和密码！');
    }
});

// 注册功能
async function showRegister() {
    const username = prompt('请输入用户名：');
    if (!username) return;
    
    const password = prompt('请输入密码：');
    if (!password) return;
    
    const email = prompt('请输入邮箱：');
    if (!email) return;
    
    const realName = prompt('请输入真实姓名：');
    if (!realName) return;
    
    const phone = prompt('请输入手机号：');
    if (!phone) return;
    
    try {
        const response = await API.auth.register({
            username,
            password,
            email,
            real_name: realName,
            phone
        });
        
        API.utils.showSuccess('注册成功！请登录。');
        openLoginModal();
    } catch (error) {
        API.utils.showError(error.message || '注册失败，请重试！');
    }
}

// 取消预约功能
async function cancelBooking(bookingId) {
    if (!confirm('确定要取消这个预约吗？')) {
        return;
    }
    
    try {
        await API.bookings.cancelBooking(bookingId);
        API.utils.showSuccess('预约已取消！');
        
        // 刷新预约列表
        if (window.location.pathname.includes('profile.html')) {
            loadUserBookings();
        }
    } catch (error) {
        API.utils.showError(error.message || '取消预约失败！');
    }
}

// 登录后更新导航栏
function updateNavAfterLogin() {
    if (currentUser) {
        // 更新"我的"链接为用户名
        const profileNavLink = document.getElementById('profile-nav-link');
        if (profileNavLink && currentUser.username) {
            profileNavLink.textContent = currentUser.username;
        }
        
        // 隐藏登录/注册链接
        const loginNavLink = document.getElementById('login-nav-link');
        if (loginNavLink) {
            loginNavLink.style.display = 'none';
        }
    }
}

// 立即预约按钮点击事件
document.querySelector('.cta-button')?.addEventListener('click', function() {
    // 滚动到场馆区域
    document.getElementById('venues')?.scrollIntoView({ 
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
document.getElementById('bookingDate')?.setAttribute('min', today);

// 加载热门场馆数据
async function loadFeaturedVenues() {
    try {
        const response = await API.venues.getPopularVenues(3);
        const venues = response.data.venues || response.data;
        
        const featuredGrid = document.querySelector('.featured-grid');
        if (featuredGrid && venues && venues.length > 0) {
            featuredGrid.innerHTML = venues.map(venue => `
                <div class="featured-card" onclick="openBookingModal('${venue.name}', ${venue.id})">
                    <div class="featured-image">
                        <i class="fas fa-${getSportIcon(venue.sport_type)}"></i>
                    </div>
                    <div class="featured-info">
                        <h3>${venue.name}</h3>
                        <p>${venue.description}</p>
                        <div class="featured-stats">
                            <span><i class="fas fa-star"></i> ${venue.rating}分</span>
                            <span><i class="fas fa-users"></i> 热门</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else if (featuredGrid) {
            // 如果没有数据，显示默认内容
            featuredGrid.innerHTML = `
                <div class="featured-card">
                    <div class="featured-image">
                        <i class="fas fa-basketball-ball"></i>
                    </div>
                    <div class="featured-info">
                        <h3>室内篮球场</h3>
                        <p>标准篮球场，木地板，空调开放</p>
                        <div class="featured-stats">
                            <span><i class="fas fa-star"></i> 4.8分</span>
                            <span><i class="fas fa-users"></i> 热门</span>
                        </div>
                    </div>
                </div>
                
                <div class="featured-card">
                    <div class="featured-image">
                        <i class="fas fa-table-tennis"></i>
                    </div>
                    <div class="featured-info">
                        <h3>羽毛球场</h3>
                        <p>专业羽毛球场地，防滑地胶</p>
                        <div class="featured-stats">
                            <span><i class="fas fa-star"></i> 4.9分</span>
                            <span><i class="fas fa-users"></i> 热门</span>
                        </div>
                    </div>
                </div>
                
                <div class="featured-card">
                    <div class="featured-image">
                        <i class="fas fa-swimming-pool"></i>
                    </div>
                    <div class="featured-info">
                        <h3>游泳池</h3>
                        <p>标准泳池，恒温控制，水质优良</p>
                        <div class="featured-stats">
                            <span><i class="fas fa-star"></i> 4.7分</span>
                            <span><i class="fas fa-users"></i> 热门</span>
                        </div>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('加载热门场馆失败:', error);
        // 显示默认内容
        const featuredGrid = document.querySelector('.featured-grid');
        if (featuredGrid) {
            featuredGrid.innerHTML = `
                <div class="featured-card">
                    <div class="featured-image">
                        <i class="fas fa-basketball-ball"></i>
                    </div>
                    <div class="featured-info">
                        <h3>室内篮球场</h3>
                        <p>标准篮球场，木地板，空调开放</p>
                        <div class="featured-stats">
                            <span><i class="fas fa-star"></i> 4.8分</span>
                            <span><i class="fas fa-users"></i> 热门</span>
                        </div>
                    </div>
                </div>
                
                <div class="featured-card">
                    <div class="featured-image">
                        <i class="fas fa-table-tennis"></i>
                    </div>
                    <div class="featured-info">
                        <h3>羽毛球场</h3>
                        <p>专业羽毛球场地，防滑地胶</p>
                        <div class="featured-stats">
                            <span><i class="fas fa-star"></i> 4.9分</span>
                            <span><i class="fas fa-users"></i> 热门</span>
                        </div>
                    </div>
                </div>
                
                <div class="featured-card">
                    <div class="featured-image">
                        <i class="fas fa-swimming-pool"></i>
                    </div>
                    <div class="featured-info">
                        <h3>游泳池</h3>
                        <p>标准泳池，恒温控制，水质优良</p>
                        <div class="featured-stats">
                            <span><i class="fas fa-star"></i> 4.7分</span>
                            <span><i class="fas fa-users"></i> 热门</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

// 获取运动类型图标
function getSportIcon(sportType) {
    const iconMap = {
        'basketball': 'basketball-ball',
        'football': 'futbol',
        'tennis': 'table-tennis',
        'swimming': 'swimming-pool',
        'badminton': 'table-tennis',
        'volleyball': 'volleyball-ball'
    };
    return iconMap[sportType] || 'basketball-ball';
}

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
            API.utils.showSuccess('感谢您的反馈！我们会尽快处理。');
            this.reset();
        });
    }
    
    // 设置保存按钮
    const saveBtns = document.querySelectorAll('.save-btn');
    saveBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            API.utils.showSuccess('设置已保存！');
        });
    });
    
    // 修改密码按钮
    const changePasswordBtn = document.querySelector('.change-password-btn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async function() {
            const oldPassword = prompt('请输入原密码：');
            if (!oldPassword) return;
            
            const newPassword = prompt('请输入新密码：');
            if (!newPassword) return;
            
            const confirmPassword = prompt('请确认新密码：');
            if (newPassword !== confirmPassword) {
                API.utils.showError('两次输入的密码不一致！');
                return;
            }
            
            try {
                await API.users.changePassword({
                    old_password: oldPassword,
                    new_password: newPassword
                });
                API.utils.showSuccess('密码修改成功！');
            } catch (error) {
                API.utils.showError(error.message || '密码修改失败！');
            }
        });
    }
    
    // 退出登录按钮
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('确定要退出登录吗？')) {
                API.utils.logout();
            }
        });
    }
    
    // VIP套餐按钮
    const planBtns = document.querySelectorAll('.plan-btn');
    planBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            API.utils.showError('VIP套餐购买功能开发中...');
        });
    });
    
    // 升级和续费按钮
    const upgradeBtn = document.querySelector('.upgrade-btn');
    const renewBtn = document.querySelector('.renew-btn');
    
    if (upgradeBtn) {
        upgradeBtn.addEventListener('click', function() {
            API.utils.showError('会员升级功能开发中...');
        });
    }
    
    if (renewBtn) {
        renewBtn.addEventListener('click', function() {
            API.utils.showError('会员续费功能开发中...');
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

// 加载用户预约列表
async function loadUserBookings() {
    if (!API.utils.isLoggedIn()) return;
    
    try {
        const response = await API.bookings.getUserBookings();
        const bookings = response.data.bookings || response.data;
        
        const bookingsContainer = document.querySelector('.bookings-list');
        if (bookingsContainer) {
            if (bookings && bookings.length > 0) {
                bookingsContainer.innerHTML = bookings.map(booking => `
                    <div class="booking-item">
                        <div class="booking-info">
                            <h4>${booking.venue_name}</h4>
                            <p>日期：${API.utils.formatDate(booking.booking_date)}</p>
                            <p>时间：${API.utils.formatTime(booking.start_time)} - ${API.utils.formatTime(booking.end_time)}</p>
                            <p>价格：${API.utils.formatPrice(booking.final_price)}</p>
                            <p>状态：${getBookingStatus(booking.status)}</p>
                        </div>
                        <div class="booking-actions">
                            ${booking.status === 'pending' ? 
                                `<button class="cancel-btn" onclick="cancelBooking(${booking.id})">取消预约</button>` : 
                                ''
                            }
                        </div>
                    </div>
                `).join('');
            } else {
                // 如果没有预约记录，显示空状态
                bookingsContainer.innerHTML = `
                    <div class="booking-item" style="text-align: center; padding: 2rem;">
                        <div class="booking-info">
                            <h4>暂无预约记录</h4>
                            <p>您还没有任何预约记录，快去预约场馆吧！</p>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('加载预约列表失败:', error);
        // 显示错误状态
        const bookingsContainer = document.querySelector('.bookings-list');
        if (bookingsContainer) {
            bookingsContainer.innerHTML = `
                <div class="booking-item" style="text-align: center; padding: 2rem;">
                    <div class="booking-info">
                        <h4>暂无预约记录</h4>
                        <p>您还没有任何预约记录，快去预约场馆吧！</p>
                    </div>
                </div>
            `;
        }
    }
}

// 获取预约状态文本
function getBookingStatus(status) {
    const statusMap = {
        'pending': '待确认',
        'confirmed': '已确认',
        'cancelled': '已取消',
        'completed': '已完成'
    };
    return statusMap[status] || status;
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
    
    .loading {
        text-align: center;
        padding: 20px;
        color: #666;
    }
`;
document.head.appendChild(style); 

 