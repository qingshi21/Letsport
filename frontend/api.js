// API基础配置
const API_BASE_URL = 'http://localhost:3000/api';

// 通用API请求函数
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // 添加认证token
    const token = localStorage.getItem('authToken');
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || '请求失败');
        }

        return data;
    } catch (error) {
        console.error('API请求错误:', error);
        throw error;
    }
}

// 认证相关API
const authAPI = {
    // 用户注册
    async register(userData) {
        return await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    // 用户登录
    async login(credentials) {
        return await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    // 获取当前用户信息
    async getCurrentUser() {
        return await apiRequest('/auth/me');
    },

    // 刷新token
    async refreshToken() {
        return await apiRequest('/auth/refresh');
    },
};

// 场馆相关API
const venuesAPI = {
    // 获取场馆列表
    async getVenues(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/venues?${queryString}` : '/venues';
        return await apiRequest(endpoint);
    },

    // 获取场馆详情
    async getVenueById(id) {
        return await apiRequest(`/venues/${id}`);
    },

    // 搜索场馆
    async searchVenues(query) {
        return await apiRequest(`/venues?search=${encodeURIComponent(query)}`);
    },

    // 获取场馆类型统计
    async getVenueTypeStats() {
        return await apiRequest('/venues/stats/types');
    },

    // 获取热门场馆
    async getPopularVenues(limit = 6) {
        return await apiRequest(`/venues/popular?limit=${limit}`);
    },
};

// 预约相关API
const bookingsAPI = {
    // 创建预约
    async createBooking(bookingData) {
        return await apiRequest('/bookings', {
            method: 'POST',
            body: JSON.stringify(bookingData),
        });
    },

    // 获取用户预约列表
    async getUserBookings(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/bookings?${queryString}` : '/bookings';
        return await apiRequest(endpoint);
    },

    // 获取预约详情
    async getBookingById(id) {
        return await apiRequest(`/bookings/${id}`);
    },

    // 取消预约
    async cancelBooking(id) {
        return await apiRequest(`/bookings/${id}/cancel`, {
            method: 'PUT',
        });
    },

    // 支付预约
    async payBooking(id) {
        return await apiRequest(`/bookings/${id}/pay`, {
            method: 'PUT',
        });
    },
};

// 用户相关API
const usersAPI = {
    // 获取用户资料
    async getUserProfile() {
        return await apiRequest('/users/profile');
    },

    // 更新用户资料
    async updateUserProfile(profileData) {
        return await apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    },

    // 修改密码
    async changePassword(passwordData) {
        return await apiRequest('/users/password', {
            method: 'PUT',
            body: JSON.stringify(passwordData),
        });
    },

    // 获取用户统计
    async getUserStats() {
        return await apiRequest('/users/stats');
    },

    // 获取用户预约历史
    async getUserBookingHistory(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/users/bookings?${queryString}` : '/users/bookings';
        return await apiRequest(endpoint);
    },

    // 获取用户评价历史
    async getUserReviewHistory(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/users/reviews?${queryString}` : '/users/reviews';
        return await apiRequest(endpoint);
    },
};

// 评价相关API
const reviewsAPI = {
    // 提交评价
    async submitReview(reviewData) {
        return await apiRequest('/reviews', {
            method: 'POST',
            body: JSON.stringify(reviewData),
        });
    },

    // 获取场馆评价
    async getVenueReviews(venueId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/reviews/venue/${venueId}?${queryString}` : `/reviews/venue/${venueId}`;
        return await apiRequest(endpoint);
    },

    // 获取用户评价
    async getUserReviews(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/reviews/user?${queryString}` : '/reviews/user';
        return await apiRequest(endpoint);
    },

    // 更新评价
    async updateReview(id, reviewData) {
        return await apiRequest(`/reviews/${id}`, {
            method: 'PUT',
            body: JSON.stringify(reviewData),
        });
    },

    // 删除评价
    async deleteReview(id) {
        return await apiRequest(`/reviews/${id}`, {
            method: 'DELETE',
        });
    },
};

// 活动相关API
const activitiesAPI = {
    // 获取活动列表
    async getActivities(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/activities?${queryString}` : '/activities';
        return await apiRequest(endpoint);
    },

    // 获取活动详情
    async getActivityById(id) {
        return await apiRequest(`/activities/${id}`);
    },

    // 参与活动
    async participateInActivity(id, data) {
        return await apiRequest(`/activities/${id}/participate`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // 取消参与活动
    async cancelParticipation(id) {
        return await apiRequest(`/activities/${id}/participate`, {
            method: 'DELETE',
        });
    },
};

// 活动评论相关API
const activityCommentsAPI = {
    // 获取活动评论
    async getActivityComments(activityId, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/activity-comments/activity/${activityId}?${queryString}` : `/activity-comments/activity/${activityId}`;
        return await apiRequest(endpoint);
    },

    // 提交评论
    async submitComment(commentData) {
        return await apiRequest('/activity-comments', {
            method: 'POST',
            body: JSON.stringify(commentData),
        });
    },

    // 点赞/取消点赞评论
    async likeComment(commentId) {
        return await apiRequest(`/activity-comments/${commentId}/like`, {
            method: 'POST',
        });
    },

    // 删除评论
    async deleteComment(commentId) {
        return await apiRequest(`/activity-comments/${commentId}`, {
            method: 'DELETE',
        });
    },

    // 获取用户的活动评论
    async getUserActivityComments(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/activity-comments/user?${queryString}` : '/activity-comments/user';
        return await apiRequest(endpoint);
    },
};

// 工具函数
const utils = {
    // 格式化日期
    formatDate(date) {
        return new Date(date).toLocaleDateString('zh-CN');
    },

    // 格式化时间
    formatTime(time) {
        return time.substring(0, 5); // 只显示HH:MM
    },

    // 格式化价格
    formatPrice(price) {
        // 确保price是数字类型
        const numPrice = parseFloat(price);
        if (isNaN(numPrice)) {
            return '¥0.00';
        }
        return `¥${numPrice.toFixed(2)}`;
    },

    // 显示加载状态
    showLoading(element) {
        element.innerHTML = '<div class="loading">加载中...</div>';
    },

    // 隐藏加载状态
    hideLoading(element) {
        element.innerHTML = '';
    },

    // 显示错误信息
    showError(message) {
        alert(message);
    },

    // 显示成功信息
    showSuccess(message) {
        alert(message);
    },

    // 检查用户是否已登录
    isLoggedIn() {
        return !!localStorage.getItem('authToken');
    },

    // 获取用户token
    getToken() {
        return localStorage.getItem('authToken');
    },

    // 保存用户token
    saveToken(token) {
        localStorage.setItem('authToken', token);
    },

    // 清除用户token
    clearToken() {
        localStorage.removeItem('authToken');
    },

    // 退出登录
    logout() {
        this.clearToken();
        window.location.href = 'index.html';
    },
};

// 导出所有API模块
window.API = {
    auth: authAPI,
    venues: venuesAPI,
    bookings: bookingsAPI,
    users: usersAPI,
    reviews: reviewsAPI,
    activities: activitiesAPI,
    activityComments: activityCommentsAPI,
    utils: utils,
}; 