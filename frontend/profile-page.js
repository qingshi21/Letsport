// 个人中心页面专用功能
document.addEventListener('DOMContentLoaded', async function() {
    console.log('个人中心页面加载完成！');
    
    // 检查登录状态
    if (!API.utils.isLoggedIn()) {
        alert('请先登录！');
        window.location.href = 'index.html';
        return;
    }
    
    // 更新导航栏显示
    updateNavigationBar();
    
    // 加载用户数据
    await loadUserProfile();
    
    // 加载用户统计
    await loadUserStats();
    
    // 加载预约历史
    await loadUserBookings();
    
    // 加载评价历史
    await loadUserReviews();
    
    // 初始化个人中心功能
    initProfilePageFeatures();
});

// 更新导航栏显示
async function updateNavigationBar() {
    try {
        // 获取当前用户信息
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
        console.error('更新导航栏失败:', error);
    }
}

// 加载用户资料
async function loadUserProfile() {
    try {
        const response = await API.users.getUserProfile();
        const user = response.data;
        
        // 更新页面显示的用户信息
        const displayNameElement = document.getElementById('user-display-name');
        if (displayNameElement) {
            // 优先显示用户设置的显示名称，如果没有则显示用户名
            displayNameElement.textContent = user.display_name || user.username || '加载中...';
        }
        
        const userEmailElement = document.getElementById('user-email');
        if (userEmailElement) {
            userEmailElement.textContent = user.email || '未设置邮箱';
        }
        
        // 更新设置页面的输入框
        const displayNameInput = document.getElementById('display-name-input');
        if (displayNameInput) {
            displayNameInput.value = user.display_name || user.username || '';
        }
        
        // 更新导航栏显示
        await updateNavigationBar();
        
    } catch (error) {
        console.error('加载用户资料失败:', error);
        API.utils.showError('加载用户资料失败！');
    }
}

// 加载用户统计
async function loadUserStats() {
    try {
        const response = await API.users.getUserStats();
        const stats = response.data;
        
        // 更新统计信息
        const totalBookingsElement = document.querySelector('.total-bookings');
        if (totalBookingsElement) {
            totalBookingsElement.textContent = stats.total_bookings || 0;
        }
        
        const totalSpentElement = document.querySelector('.total-spent');
        if (totalSpentElement) {
            totalSpentElement.textContent = API.utils.formatPrice(stats.total_spent || 0);
        }
        
        const totalReviewsElement = document.querySelector('.total-reviews');
        if (totalReviewsElement) {
            totalReviewsElement.textContent = stats.total_reviews || 0;
        }
        
    } catch (error) {
        console.error('加载用户统计失败:', error);
    }
}

// 加载用户预约历史
async function loadUserBookings() {
    try {
        const response = await API.bookings.getUserBookings();
        const bookings = response.data.bookings || response.data;
        
        const bookingsContainer = document.querySelector('.bookings-list');
        if (bookingsContainer) {
            if (bookings.length === 0) {
                bookingsContainer.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <p>暂无预约记录</p>
                    </div>
                `;
            } else {
                bookingsContainer.innerHTML = bookings.map(booking => `
                    <div class="booking-item">
                        <div class="booking-info">
                            <h4>${booking.venue_name}</h4>
                            <p>日期：${API.utils.formatDate(booking.booking_date)}</p>
                            <p>时间：${API.utils.formatTime(booking.start_time)} - ${API.utils.formatTime(booking.end_time)}</p>
                            <p>价格：${API.utils.formatPrice(booking.final_price)}</p>
                            <p>状态：<span class="status-${booking.status}">${getBookingStatus(booking.status)}</span></p>
                        </div>
                        <div class="booking-actions">
                            ${booking.status === 'pending' ? 
                                `<button class="cancel-btn" onclick="cancelBooking(${booking.id})">取消预约</button>` : 
                                ''
                            }
                            ${booking.status === 'confirmed' ? 
                                `<button class="pay-btn" onclick="payBooking(${booking.id})">立即支付</button>` : 
                                ''
                            }
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('加载预约历史失败:', error);
        API.utils.showError('加载预约历史失败！');
    }
}

// 加载用户评价历史
async function loadUserReviews() {
    try {
        const response = await API.reviews.getUserReviews();
        const reviews = response.data.reviews || response.data;
        
        const reviewsContainer = document.querySelector('.reviews-list');
        if (reviewsContainer) {
            if (reviews.length === 0) {
                reviewsContainer.innerHTML = `
                    <div class="no-data">
                        <i class="fas fa-star"></i>
                        <p>暂无评价记录</p>
                    </div>
                `;
            } else {
                reviewsContainer.innerHTML = reviews.map(review => `
                    <div class="review-item">
                        <div class="review-header">
                            <h4>${review.venue_name}</h4>
                            <div class="review-rating">
                                ${generateStarRating(review.rating)}
                            </div>
                        </div>
                        <div class="review-content">
                            <p>${review.content}</p>
                            <span class="review-date">${API.utils.formatDate(review.created_at)}</span>
                        </div>
                        <div class="review-actions">
                            <button class="edit-btn" onclick="editReview(${review.id})">编辑</button>
                            <button class="delete-btn" onclick="deleteReview(${review.id})">删除</button>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('加载评价历史失败:', error);
        API.utils.showError('加载评价历史失败！');
    }
}

// 初始化个人中心页面功能
function initProfilePageFeatures() {
    // 更新用户资料表单
    const updateProfileForm = document.getElementById('updateProfileForm');
    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                real_name: document.getElementById('realName').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value
            };
            
            try {
                await API.users.updateUserProfile(formData);
                API.utils.showSuccess('资料更新成功！');
                await loadUserProfile(); // 重新加载用户资料
            } catch (error) {
                API.utils.showError(error.message || '资料更新失败！');
            }
        });
    }
    
    // 初始化评价功能
    initReviewFeatures();
}

// 支付预约
async function payBooking(bookingId) {
    if (!confirm('确定要支付这个预约吗？')) {
        return;
    }
    
    try {
        await API.bookings.payBooking(bookingId);
        API.utils.showSuccess('支付成功！');
        
        // 刷新预约列表
        await loadUserBookings();
    } catch (error) {
        API.utils.showError(error.message || '支付失败！');
    }
}

// 编辑评价
async function editReview(reviewId) {
    const newContent = prompt('请输入新的评价内容：');
    if (!newContent) return;
    
    const newRating = prompt('请输入新的评分（1-5）：');
    if (!newRating || newRating < 1 || newRating > 5) {
        API.utils.showError('请输入有效的评分！');
        return;
    }
    
    try {
        await API.reviews.updateReview(reviewId, {
            content: newContent,
            rating: parseInt(newRating)
        });
        API.utils.showSuccess('评价更新成功！');
        
        // 刷新评价列表
        await loadUserReviews();
    } catch (error) {
        API.utils.showError(error.message || '评价更新失败！');
    }
}

// 删除评价
async function deleteReview(reviewId) {
    if (!confirm('确定要删除这个评价吗？')) {
        return;
    }
    
    try {
        await API.reviews.deleteReview(reviewId);
        API.utils.showSuccess('评价删除成功！');
        
        // 刷新评价列表
        await loadUserReviews();
    } catch (error) {
        API.utils.showError(error.message || '评价删除失败！');
    }
}

// 获取用户等级文本
function getUserLevelText(level) {
    const levelMap = {
        'bronze': '青铜会员',
        'silver': '白银会员',
        'gold': '黄金会员',
        'platinum': '铂金会员'
    };
    return levelMap[level] || '普通用户';
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

// 生成星级评分
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// 添加CSS样式
const profileStyles = document.createElement('style');
profileStyles.textContent = `
    .no-data {
        text-align: center;
        padding: 40px;
        color: #666;
    }
    
    .no-data i {
        font-size: 48px;
        color: #ddd;
        margin-bottom: 20px;
    }
    
    .no-data p {
        margin: 10px 0;
    }
    
    .status-pending {
        color: #f39c12;
    }
    
    .status-confirmed {
        color: #27ae60;
    }
    
    .status-cancelled {
        color: #e74c3c;
    }
    
    .status-completed {
        color: #3498db;
    }
    
    .review-item {
        border: 1px solid #eee;
        border-radius: 8px;
        padding: 15px;
        margin-bottom: 15px;
    }
    
    .review-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
    }
    
    .review-rating {
        color: #f39c12;
    }
    
    .review-content {
        margin-bottom: 10px;
    }
    
    .review-date {
        color: #999;
        font-size: 12px;
    }
    
    .review-actions {
        display: flex;
        gap: 10px;
    }
    
    .edit-btn, .delete-btn {
        padding: 5px 10px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }
    
    .edit-btn {
        background-color: #3498db;
        color: white;
    }
    
    .delete-btn {
        background-color: #e74c3c;
        color: white;
    }
    
    .pay-btn {
        background-color: #27ae60;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
    }
`;
document.head.appendChild(profileStyles);

// 更新显示名称
async function updateDisplayName() {
    const displayNameInput = document.getElementById('display-name-input');
    const newDisplayName = displayNameInput.value.trim();
    
    if (!newDisplayName) {
        API.utils.showError('显示名称不能为空！');
        return;
    }
    
    // 检查是否与当前值相同
    const currentDisplayName = document.getElementById('user-display-name').textContent;
    if (newDisplayName === currentDisplayName) {
        API.utils.showError('显示名称没有变化！');
        return;
    }
    
    try {
        console.log('正在更新显示名称:', newDisplayName);
        
        // 调用API更新用户资料
        const response = await API.users.updateUserProfile({
            display_name: newDisplayName
        });
        
        console.log('API响应:', response);
        
        // 更新页面显示
        const displayNameElement = document.getElementById('user-display-name');
        if (displayNameElement) {
            displayNameElement.textContent = newDisplayName;
        }
        
        // 更新导航栏显示
        await updateNavigationBar();
        
        API.utils.showSuccess('显示名称更新成功！');
        
    } catch (error) {
        console.error('更新显示名称失败:', error);
        API.utils.showError(error.message || '更新显示名称失败！');
    }
}

// 退出登录功能
function logout() {
    if (confirm('确定要退出登录吗？')) {
        // 清除本地存储的登录信息
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('authToken');
        
        // 显示退出成功消息
        API.utils.showSuccess('已退出登录，正在跳转...');
        
        // 延迟跳转到首页
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
} 

// 评价相关功能
function initReviewFeatures() {
    // 为所有评价按钮添加点击事件
    const reviewButtons = document.querySelectorAll('.review-btn');
    reviewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const bookingCard = this.closest('.booking-card');
            const venueName = bookingCard.querySelector('h4').textContent;
            const bookingDate = bookingCard.querySelector('p').textContent;
            
            showReviewModal(venueName, bookingDate);
        });
    });
}

// 显示评价模态框
function showReviewModal(venueName, bookingDate) {
    const modalHtml = `
        <div class="modal" id="reviewModal">
            <div class="modal-content">
                <h3>提交评价</h3>
                <form id="reviewForm">
                    <div class="form-group">
                        <label>场馆名称</label>
                        <input type="text" value="${venueName}" readonly>
                    </div>
                    <div class="form-group">
                        <label>预约时间</label>
                        <input type="text" value="${bookingDate}" readonly>
                    </div>
                    <div class="form-group">
                        <label>评分</label>
                        <div class="rating-input">
                            <input type="radio" name="rating" value="5" id="star5" required>
                            <label for="star5">5星</label>
                            <input type="radio" name="rating" value="4" id="star4">
                            <label for="star4">4星</label>
                            <input type="radio" name="rating" value="3" id="star3">
                            <label for="star3">3星</label>
                            <input type="radio" name="rating" value="2" id="star2">
                            <label for="star2">2星</label>
                            <input type="radio" name="rating" value="1" id="star1">
                            <label for="star1">1星</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>评价内容</label>
                        <textarea name="content" placeholder="请分享您的使用体验..." maxlength="1000" rows="4"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit">提交评价</button>
                        <button type="button" onclick="closeReviewModal()">取消</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 处理表单提交
    document.getElementById('reviewForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitReview(e.target);
    });
}

// 关闭评价模态框
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.remove();
    }
}

// 提交评价
async function submitReview(form) {
    try {
        const formData = new FormData(form);
        const rating = parseInt(formData.get('rating'));
        const content = formData.get('content');
        
        // 这里需要获取场馆ID，我们可以通过场馆名称来查找
        const venueName = form.querySelector('input[readonly]').value;
        
        // 获取场馆ID
        const venuesResponse = await API.venues.getVenues();
        const venues = venuesResponse.data || [];
        const venue = venues.find(v => v.name === venueName);
        
        if (!venue) {
            alert('未找到对应场馆信息');
            return;
        }
        
        const reviewData = {
            venue_id: venue.id,
            rating: rating,
            content: content
        };
        
        const response = await API.reviews.submitReview(reviewData);
        
        if (response.success) {
            alert('评价提交成功！');
            closeReviewModal();
            // 重新加载评价历史
            await loadUserReviews();
        } else {
            alert('评价提交失败：' + response.message);
        }
    } catch (error) {
        console.error('提交评价失败:', error);
        alert('评价提交失败：' + error.message);
    }
} 