// 场馆页面专用功能
document.addEventListener('DOMContentLoaded', async function() {
    console.log('场馆页面加载完成！');
    
    // 检查登录状态并更新导航栏
    await checkAuthStatus();
    
    // 加载场馆数据
    await loadVenues();
    
    // 初始化搜索功能
    initVenueSearch();
});

// 检查登录状态并更新导航栏
async function checkAuthStatus() {
    if (API.utils.isLoggedIn()) {
        try {
            const response = await API.auth.getCurrentUser();
            const user = response.data;
            
            // 更新"我的"链接为用户名
            const profileNavLink = document.getElementById('profile-nav-link');
            if (profileNavLink && user.username) {
                profileNavLink.textContent = user.username;
            }
            
            // 隐藏登录/注册链接
            const loginNavLink = document.getElementById('login-nav-link');
            if (loginNavLink) {
                loginNavLink.style.display = 'none';
            }
        } catch (error) {
            console.error('获取用户信息失败:', error);
            if (error.message.includes('无效的访问令牌') || error.message.includes('访问令牌已过期')) {
                API.utils.clearToken();
            }
        }
    }
}

// 加载场馆数据
async function loadVenues() {
    try {
        const response = await API.venues.getVenues();
        const venues = response.data.venues || response.data;
        
        const venuesGrid = document.querySelector('.venues-grid');
        if (venuesGrid) {
            venuesGrid.innerHTML = venues.map(venue => `
                <div class="venue-card" 
                     data-sport="${venue.sport_type}" 
                     data-distance="${venue.distance || 0}" 
                     data-price="${venue.price_per_hour}" 
                     data-rating="${venue.rating}">
                    <div class="venue-image">
                        <i class="fas fa-${getSportIcon(venue.sport_type)}"></i>
                    </div>
                    <div class="venue-info">
                        <h3>${venue.name}</h3>
                        <p class="venue-description">${venue.description}</p>
                        <div class="venue-details">
                            <span><i class="fas fa-map-marker-alt"></i> ${venue.address}</span>
                            <span><i class="fas fa-clock"></i> ${venue.opening_hours || '全天开放'}</span>
                            <span><i class="fas fa-yen-sign"></i> ${venue.price_per_hour}元/小时</span>
                            <span><i class="fas fa-star"></i> ${venue.rating}分</span>
                        </div>
                        <button class="book-btn" onclick="openBookingModal('${venue.name}', ${venue.id})">立即预约</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('加载场馆数据失败:', error);
        API.utils.showError('加载场馆数据失败，请刷新页面重试！');
    }
}

// 初始化场馆搜索功能
function initVenueSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.querySelector('.search-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', performVenueSearch);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(performVenueSearch, 500));
    }
}

// 执行场馆搜索
async function performVenueSearch() {
    const searchTerm = document.getElementById('searchInput')?.value.trim();
    
    if (!searchTerm) {
        await loadVenues(); // 如果搜索词为空，加载所有场馆
        return;
    }
    
    try {
        const response = await API.venues.searchVenues(searchTerm);
        const venues = response.data.venues || response.data;
        
        const venuesGrid = document.querySelector('.venues-grid');
        if (venuesGrid) {
            if (venues.length === 0) {
                venuesGrid.innerHTML = `
                    <div class="no-results">
                        <i class="fas fa-search"></i>
                        <p>未找到相关场馆</p>
                        <p>请尝试其他关键词</p>
                    </div>
                `;
            } else {
                venuesGrid.innerHTML = venues.map(venue => `
                    <div class="venue-card" 
                         data-sport="${venue.sport_type}" 
                         data-distance="${venue.distance || 0}" 
                         data-price="${venue.price_per_hour}" 
                         data-rating="${venue.rating}">
                        <div class="venue-image">
                            <i class="fas fa-${getSportIcon(venue.sport_type)}"></i>
                        </div>
                        <div class="venue-info">
                            <h3>${venue.name}</h3>
                            <p class="venue-description">${venue.description}</p>
                            <div class="venue-details">
                                <span><i class="fas fa-map-marker-alt"></i> ${venue.address}</span>
                                <span><i class="fas fa-clock"></i> ${venue.opening_hours || '全天开放'}</span>
                                <span><i class="fas fa-yen-sign"></i> ${venue.price_per_hour}元/小时</span>
                                <span><i class="fas fa-star"></i> ${venue.rating}分</span>
                            </div>
                            <button class="book-btn" onclick="openBookingModal('${venue.name}', ${venue.id})">立即预约</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('搜索场馆失败:', error);
        API.utils.showError('搜索失败，请重试！');
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
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

// 添加CSS样式
const venueStyles = document.createElement('style');
venueStyles.textContent = `
    .no-results {
        text-align: center;
        padding: 40px;
        color: #666;
    }
    
    .no-results i {
        font-size: 48px;
        color: #ddd;
        margin-bottom: 20px;
    }
    
    .no-results p {
        margin: 10px 0;
    }
`;
document.head.appendChild(venueStyles); 