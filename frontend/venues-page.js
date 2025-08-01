// 场馆页面专用功能
let currentVenueId = null;
let currentVenueName = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('场馆页面加载完成！');
    
    // 检查登录状态并更新导航栏
    await updateNavigationBar();
    
    // 加载场馆数据
    await loadVenues();
    
    // 初始化搜索功能
    initVenueSearch();
    
    // 初始化评论模态框事件
    initCommentModalEvents();
});

// 初始化评论模态框事件
function initCommentModalEvents() {
    // 为评分选择添加事件监听
    document.addEventListener('change', function(e) {
        if (e.target.name === 'venueRating') {
            console.log('评分选择:', e.target.value);
        }
    });
    
    // 为评论内容输入框添加事件监听
    const commentContent = document.getElementById('commentContent');
    if (commentContent) {
        commentContent.addEventListener('input', function(e) {
            console.log('评论内容:', e.target.value);
        });
    }
}

// 通用的导航栏更新函数
async function updateNavigationBar() {
    if (API.utils.isLoggedIn()) {
        try {
            const response = await API.auth.getCurrentUser();
            const user = response.data;
            
            // 更新"我的"链接为显示名称或用户名
            const profileNavLink = document.getElementById('profile-nav-link');
            if (profileNavLink) {
                const displayName = user.display_name || user.username || '我的';
                profileNavLink.textContent = displayName;
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
                // 重新显示登录按钮
                const loginNavLink = document.getElementById('login-nav-link');
                if (loginNavLink) {
                    loginNavLink.style.display = 'inline-block';
                }
                // 重置"我的"链接文本
                const profileNavLink = document.getElementById('profile-nav-link');
                if (profileNavLink) {
                    profileNavLink.textContent = '我的';
                }
            }
        }
    } else {
        // 如果用户未登录，显示登录按钮
        const loginNavLink = document.getElementById('login-nav-link');
        if (loginNavLink) {
            loginNavLink.style.display = 'inline-block';
        }
        
        // 重置"我的"链接文本
        const profileNavLink = document.getElementById('profile-nav-link');
        if (profileNavLink) {
            profileNavLink.textContent = '我的';
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
                        <div class="venue-actions">
                            <button class="book-btn" onclick="openBookingModal('${venue.name}', ${venue.id})">立即预约</button>
                            <button class="comment-btn" onclick="openCommentModal(${venue.id}, '${venue.name}')">查看评论</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('加载场馆数据失败:', error);
        API.utils.showError('加载场馆数据失败，请刷新页面重试！');
    }
}

// 打开评论模态框
async function openCommentModal(venueId, venueName) {
    currentVenueId = venueId;
    currentVenueName = venueName;
    
    document.getElementById('commentModalTitle').textContent = `${venueName} - 评论`;
    document.getElementById('commentModal').style.display = 'flex';
    
    // 清空表单
    document.getElementById('commentContent').value = '';
    document.querySelectorAll('input[name="venueRating"]').forEach(radio => radio.checked = false);
    
    // 加载评论
    await loadVenueComments(venueId);
}

// 关闭评论模态框
function closeCommentModal() {
    document.getElementById('commentModal').style.display = 'none';
    currentVenueId = null;
    currentVenueName = null;
    
    // 清空表单
    document.getElementById('commentContent').value = '';
    document.querySelectorAll('input[name="venueRating"]').forEach(radio => radio.checked = false);
}

// 加载场馆评论
async function loadVenueComments(venueId) {
    try {
        const response = await API.reviews.getVenueReviews(venueId);
        const reviews = response.data.reviews || response.data;
        
        displayVenueComments(reviews);
    } catch (error) {
        console.error('加载评论失败:', error);
        document.getElementById('venueCommentsList').innerHTML = '<p>加载评论失败</p>';
    }
}

// 显示场馆评论
function displayVenueComments(reviews) {
    const commentsList = document.getElementById('venueCommentsList');
    
    if (!reviews || reviews.length === 0) {
        commentsList.innerHTML = '<p>暂无评论</p>';
        return;
    }
    
    const commentsHTML = reviews.map(review => `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${review.real_name || review.username}</span>
                <span class="comment-time">${formatDate(review.created_at)}</span>
                ${review.rating ? `<span class="comment-rating">${'★'.repeat(review.rating)}</span>` : ''}
            </div>
            <div class="comment-content">${review.content}</div>
            <div class="comment-actions">
                <button onclick="likeVenueComment(${review.id})" class="like-btn">
                    <i class="fas fa-thumbs-up"></i> 点赞
                </button>
            </div>
        </div>
    `).join('');
    
    commentsList.innerHTML = commentsHTML;
}

// 提交场馆评论
async function submitVenueComment() {
    console.log('开始提交评论...');
    
    // 检查用户登录状态
    if (!API.utils.isLoggedIn()) {
        alert('请先登录');
        if (typeof openLoginModal === 'function') {
            openLoginModal();
        }
        return;
    }
    
    const content = document.getElementById('commentContent').value.trim();
    const rating = document.querySelector('input[name="venueRating"]:checked')?.value;
    
    console.log('评论内容:', content);
    console.log('评分:', rating);
    
    if (!content) {
        alert('请输入评论内容');
        return;
    }
    
    if (!rating) {
        alert('请选择评分');
        return;
    }
    
    try {
        const reviewData = {
            venue_id: currentVenueId,
            rating: parseInt(rating),
            content: content
        };
        
        console.log('提交的评论数据:', reviewData);
        
        const response = await API.reviews.submitReview(reviewData);
        
        if (response.success) {
            alert('评论提交成功！');
            document.getElementById('commentContent').value = '';
            document.querySelectorAll('input[name="venueRating"]').forEach(radio => radio.checked = false);
            // 重新加载评论
            await loadVenueComments(currentVenueId);
        } else {
            alert('评论提交失败：' + response.message);
        }
    } catch (error) {
        console.error('提交评论失败:', error);
        alert('评论提交失败：' + error.message);
    }
}

// 点赞评论
async function likeVenueComment(commentId) {
    // 检查用户登录状态
    if (!API.utils.isLoggedIn()) {
        alert('请先登录');
        if (typeof openLoginModal === 'function') {
            openLoginModal();
        }
        return;
    }
    
    try {
        // 这里可以添加点赞功能，暂时只是显示提示
        alert('点赞功能开发中...');
    } catch (error) {
        console.error('点赞失败:', error);
        alert('点赞失败：' + error.message);
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
                        <div class="venue-actions">
                            <button class="book-btn" onclick="openBookingModal('${venue.name}', ${venue.id})">立即预约</button>
                            <button class="comment-btn" onclick="openCommentModal(${venue.id}, '${venue.name}')">查看评论</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('搜索场馆失败:', error);
        API.utils.showError('搜索失败，请重试！');
    }
}

// 工具函数
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

function getSportIcon(sportType) {
    const iconMap = {
        'basketball': 'basketball-ball',
        'badminton': 'table-tennis',
        'tennis': 'table-tennis',
        'swimming': 'swimming-pool',
        'football': 'futbol',
        'volleyball': 'volleyball-ball'
    };
    return iconMap[sportType] || 'basketball-ball';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
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