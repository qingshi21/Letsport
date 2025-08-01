// 管理员仪表板功能
let adminToken = localStorage.getItem('adminToken');
let adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}');

// 检查管理员登录状态
function checkAdminAuth() {
    if (!adminToken || !adminUser.username || adminUser.username !== 'admin') {
        window.location.href = 'admin-login.html';
        return false;
    }
    return true;
}

// 页面加载时检查权限
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAdminAuth()) return;
    
    // 初始化页面
    loadOverview();
    setupNavigation();
});

// 设置导航
function setupNavigation() {
    const navLinks = document.querySelectorAll('.admin-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有active类
            navLinks.forEach(l => l.classList.remove('active'));
            // 添加active类到当前链接
            this.classList.add('active');
            
            // 隐藏所有内容区域
            const sections = document.querySelectorAll('.content-section');
            sections.forEach(section => section.classList.add('hidden'));
            
            // 显示对应的内容区域
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.remove('hidden');
            
            // 加载对应数据
            switch(sectionId) {
                case 'overview':
                    loadOverview();
                    break;
                case 'venues':
                    loadVenues();
                    break;
                case 'bookings':
                    loadBookings();
                    break;
                case 'users':
                    loadUsers();
                    break;
                case 'reviews':
                    loadReviews();
                    break;
            }
        });
    });
}

// 加载概览数据
async function loadOverview() {
    try {
        const [usersResponse, venuesResponse, bookingsResponse, reviewsResponse] = await Promise.all([
            apiRequest('/api/admin/users/count', { method: 'GET' }),
            apiRequest('/api/admin/venues/count', { method: 'GET' }),
            apiRequest('/api/admin/bookings/today', { method: 'GET' }),
            apiRequest('/api/admin/reviews/pending', { method: 'GET' })
        ]);
        
        document.getElementById('totalUsers').textContent = usersResponse.data?.count || 0;
        document.getElementById('totalVenues').textContent = venuesResponse.data?.count || 0;
        document.getElementById('todayBookings').textContent = bookingsResponse.data?.count || 0;
        document.getElementById('pendingReviews').textContent = reviewsResponse.data?.count || 0;
    } catch (error) {
        console.error('加载概览数据失败:', error);
    }
}

// 加载场馆数据
async function loadVenues() {
    try {
        const response = await apiRequest('/api/admin/venues', { method: 'GET' });
        const venues = response.data || [];
        
        const tbody = document.getElementById('venuesTableBody');
        tbody.innerHTML = '';
        
        venues.forEach(venue => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${venue.id}</td>
                <td>${venue.name}</td>
                <td>${getSportTypeName(venue.sport_type)}</td>
                <td>¥${venue.price_per_hour}</td>
                <td>${getStatusName(venue.status)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editVenue(${venue.id})">编辑</button>
                    <button class="action-btn delete-btn" onclick="deleteVenue(${venue.id})">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载场馆数据失败:', error);
    }
}

// 加载预约数据
async function loadBookings() {
    try {
        const response = await apiRequest('/api/admin/bookings', { method: 'GET' });
        const bookings = response.data || [];
        
        const tbody = document.getElementById('bookingsTableBody');
        tbody.innerHTML = '';
        
        bookings.forEach(booking => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${booking.id}</td>
                <td>${booking.user_name}</td>
                <td>${booking.venue_name}</td>
                <td>${booking.booking_date} ${booking.start_time}-${booking.end_time}</td>
                <td>${getBookingStatusName(booking.status)}</td>
                <td>${getPaymentStatusName(booking.payment_status)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editBooking(${booking.id})">编辑</button>
                    <button class="action-btn delete-btn" onclick="deleteBooking(${booking.id})">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载预约数据失败:', error);
    }
}

// 加载用户数据
async function loadUsers() {
    try {
        const response = await apiRequest('/api/admin/users', { method: 'GET' });
        const users = response.data || [];
        
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${getMembershipLevelName(user.membership_level)}</td>
                <td>${user.points}</td>
                <td>${getUserStatusName(user.status)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editUser(${user.id})">编辑</button>
                    <button class="action-btn delete-btn" onclick="deleteUser(${user.id})">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载用户数据失败:', error);
    }
}

// 加载评价数据
async function loadReviews() {
    try {
        const response = await apiRequest('/api/admin/reviews', { method: 'GET' });
        const reviews = response.data || [];
        
        const tbody = document.getElementById('reviewsTableBody');
        tbody.innerHTML = '';
        
        reviews.forEach(review => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${review.id}</td>
                <td>${review.user_name}</td>
                <td>${review.venue_name}</td>
                <td>${review.rating}/5</td>
                <td>${review.content}</td>
                <td>${getReviewStatusName(review.status)}</td>
                <td>
                    <button class="action-btn approve-btn" onclick="approveReview(${review.id})">通过</button>
                    <button class="action-btn reject-btn" onclick="rejectReview(${review.id})">拒绝</button>
                    <button class="action-btn delete-btn" onclick="deleteReview(${review.id})">删除</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('加载评价数据失败:', error);
    }
}

// 工具函数
function getSportTypeName(type) {
    const types = {
        'basketball': '篮球',
        'badminton': '羽毛球',
        'tennis': '网球',
        'swimming': '游泳',
        'football': '足球',
        'volleyball': '排球',
        'table_tennis': '乒乓球',
        'gym': '健身'
    };
    return types[type] || type;
}

function getStatusName(status) {
    const statuses = {
        'active': '正常',
        'maintenance': '维护中',
        'closed': '已关闭'
    };
    return statuses[status] || status;
}

function getBookingStatusName(status) {
    const statuses = {
        'pending': '待确认',
        'confirmed': '已确认',
        'completed': '已完成',
        'cancelled': '已取消'
    };
    return statuses[status] || status;
}

function getPaymentStatusName(status) {
    const statuses = {
        'unpaid': '未支付',
        'paid': '已支付',
        'refunded': '已退款'
    };
    return statuses[status] || status;
}

function getMembershipLevelName(level) {
    const levels = {
        'bronze': '青铜会员',
        'silver': '白银会员',
        'gold': '黄金会员',
        'platinum': '铂金会员'
    };
    return levels[level] || level;
}

function getUserStatusName(status) {
    const statuses = {
        'active': '正常',
        'inactive': '禁用',
        'banned': '封禁'
    };
    return statuses[status] || status;
}

function getReviewStatusName(status) {
    const statuses = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '已拒绝'
    };
    return statuses[status] || status;
}

// 退出登录
function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = 'admin-login.html';
}

// API请求函数（带管理员认证）
async function apiRequest(endpoint, options = {}) {
    const baseUrl = 'http://localhost:3000';
    const url = `${baseUrl}${endpoint}`;
    
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || '请求失败');
        }
        
        return data;
    } catch (error) {
        console.error('API请求失败:', error);
        throw error;
    }
}

// 场馆管理功能
async function editVenue(id) {
    try {
        // 获取场馆详情
        const response = await apiRequest(`/api/admin/venues/${id}`, { method: 'GET' });
        const venue = response.data;
        
        // 显示编辑表单
        const formHtml = `
            <div class="modal" id="editVenueModal">
                <div class="modal-content">
                    <h3>编辑场馆信息</h3>
                    <form id="editVenueForm">
                        <div class="form-group">
                            <label>场馆名称</label>
                            <input type="text" name="name" value="${venue.name}" required>
                        </div>
                        <div class="form-group">
                            <label>运动类型</label>
                            <select name="sport_type" required>
                                <option value="basketball" ${venue.sport_type === 'basketball' ? 'selected' : ''}>篮球</option>
                                <option value="football" ${venue.sport_type === 'football' ? 'selected' : ''}>足球</option>
                                <option value="tennis" ${venue.sport_type === 'tennis' ? 'selected' : ''}>网球</option>
                                <option value="badminton" ${venue.sport_type === 'badminton' ? 'selected' : ''}>羽毛球</option>
                                <option value="volleyball" ${venue.sport_type === 'volleyball' ? 'selected' : ''}>排球</option>
                                <option value="swimming" ${venue.sport_type === 'swimming' ? 'selected' : ''}>游泳</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>场馆描述</label>
                            <textarea name="description" required>${venue.description}</textarea>
                        </div>
                        <div class="form-group">
                            <label>场馆地址</label>
                            <input type="text" name="address" value="${venue.address}" required>
                        </div>
                        <div class="form-group">
                            <label>每小时价格</label>
                            <input type="number" name="price_per_hour" value="${venue.price_per_hour}" step="0.01" required>
                        </div>
                        <div class="form-group">
                            <label>容量</label>
                            <input type="number" name="capacity" value="${venue.capacity}" required>
                        </div>
                        <div class="form-actions">
                            <button type="submit">保存</button>
                            <button type="button" onclick="closeModal('editVenueModal')">取消</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', formHtml);
        
        // 处理表单提交
        document.getElementById('editVenueForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                await apiRequest(`/api/admin/venues/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                
                alert('场馆信息更新成功！');
                closeModal('editVenueModal');
                loadVenues(); // 重新加载数据
            } catch (error) {
                alert('更新失败：' + error.message);
            }
        });
    } catch (error) {
        alert('获取场馆信息失败：' + error.message);
    }
}

// 添加新场馆
function showAddVenueForm() {
    const formHtml = `
        <div class="modal" id="addVenueModal">
            <div class="modal-content">
                <h3>添加新场馆</h3>
                <form id="addVenueForm">
                    <div class="form-group">
                        <label>场馆名称</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>运动类型</label>
                        <select name="sport_type" required>
                            <option value="basketball">篮球</option>
                            <option value="football">足球</option>
                            <option value="tennis">网球</option>
                            <option value="badminton">羽毛球</option>
                            <option value="volleyball">排球</option>
                            <option value="swimming">游泳</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>场馆描述</label>
                        <textarea name="description" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>场馆地址</label>
                        <input type="text" name="address" required>
                    </div>
                    <div class="form-group">
                        <label>每小时价格</label>
                        <input type="number" name="price_per_hour" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>容量</label>
                        <input type="number" name="capacity" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit">添加</button>
                        <button type="button" onclick="closeModal('addVenueModal')">取消</button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', formHtml);
    
    // 处理表单提交
    document.getElementById('addVenueForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        try {
            await apiRequest('/api/admin/venues', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            alert('场馆添加成功！');
            closeModal('addVenueModal');
            loadVenues(); // 重新加载数据
        } catch (error) {
            alert('添加失败：' + error.message);
        }
    });
}

// 删除场馆
async function deleteVenue(id) {
    if (confirm('确定要删除这个场馆吗？')) {
        try {
            const response = await apiRequest(`/api/admin/venues/${id}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                alert('场馆删除成功！');
                loadVenues(); // 重新加载数据
            } else {
                alert('删除失败：' + response.message);
            }
        } catch (error) {
            alert('删除失败：' + error.message);
        }
    }
}

// 预约管理功能
async function editBooking(id) {
    try {
        const newStatus = prompt('请输入新状态 (pending/confirmed/completed/cancelled):');
        if (newStatus && ['pending', 'confirmed', 'completed', 'cancelled'].includes(newStatus)) {
            const response = await apiRequest(`/api/admin/bookings/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            });
            
            if (response.success) {
                alert('预约状态更新成功！');
                loadBookings(); // 重新加载数据
            } else {
                alert('更新失败：' + response.message);
            }
        }
    } catch (error) {
        alert('操作失败：' + error.message);
    }
}

async function deleteBooking(id) {
    if (confirm('确定要删除这个预约吗？')) {
        try {
            const response = await apiRequest(`/api/admin/bookings/${id}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                alert('预约删除成功！');
                loadBookings(); // 重新加载数据
            } else {
                alert('删除失败：' + response.message);
            }
        } catch (error) {
            alert('删除失败：' + error.message);
        }
    }
}

// 用户管理功能
async function editUser(id) {
    try {
        // 获取用户详情
        const response = await apiRequest(`/api/admin/users/${id}`, { method: 'GET' });
        const user = response.data;
        
        // 显示编辑表单
        const formHtml = `
            <div class="modal" id="editUserModal">
                <div class="modal-content">
                    <h3>编辑用户信息</h3>
                    <form id="editUserForm">
                        <div class="form-group">
                            <label>用户名</label>
                            <input type="text" value="${user.username}" disabled>
                        </div>
                        <div class="form-group">
                            <label>邮箱</label>
                            <input type="email" name="email" value="${user.email || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>手机号</label>
                            <input type="tel" name="phone" value="${user.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>真实姓名</label>
                            <input type="text" name="real_name" value="${user.real_name || ''}">
                        </div>
                        <div class="form-group">
                            <label>会员等级</label>
                            <select name="membership_level" required>
                                <option value="bronze" ${user.membership_level === 'bronze' ? 'selected' : ''}>青铜</option>
                                <option value="silver" ${user.membership_level === 'silver' ? 'selected' : ''}>白银</option>
                                <option value="gold" ${user.membership_level === 'gold' ? 'selected' : ''}>黄金</option>
                                <option value="platinum" ${user.membership_level === 'platinum' ? 'selected' : ''}>铂金</option>
                            </select>
                        </div>
                        <div class="form-actions">
                            <button type="submit">保存</button>
                            <button type="button" onclick="closeModal('editUserModal')">取消</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', formHtml);
        
        // 处理表单提交
        document.getElementById('editUserForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                await apiRequest(`/api/admin/users/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data)
                });
                
                alert('用户信息更新成功！');
                closeModal('editUserModal');
                loadUsers(); // 重新加载数据
            } catch (error) {
                alert('更新失败：' + error.message);
            }
        });
    } catch (error) {
        alert('获取用户信息失败：' + error.message);
    }
}

async function deleteUser(id) {
    if (confirm('确定要删除这个用户吗？')) {
        try {
            const response = await apiRequest(`/api/admin/users/${id}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                alert('用户删除成功！');
                loadUsers(); // 重新加载数据
            } else {
                alert('删除失败：' + response.message);
            }
        } catch (error) {
            alert('删除失败：' + error.message);
        }
    }
}

// 评价管理功能
async function approveReview(id) {
    if (confirm('确定要通过这个评价吗？')) {
        try {
            const response = await apiRequest(`/api/admin/reviews/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'approved' })
            });
            
            if (response.success) {
                alert('评价审核通过！');
                loadReviews(); // 重新加载数据
            } else {
                alert('审核失败：' + response.message);
            }
        } catch (error) {
            alert('审核失败：' + error.message);
        }
    }
}

async function rejectReview(id) {
    if (confirm('确定要拒绝这个评价吗？')) {
        try {
            const response = await apiRequest(`/api/admin/reviews/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'rejected' })
            });
            
            if (response.success) {
                alert('评价已拒绝！');
                loadReviews(); // 重新加载数据
            } else {
                alert('操作失败：' + response.message);
            }
        } catch (error) {
            alert('操作失败：' + error.message);
        }
    }
}

async function deleteReview(id) {
    if (confirm('确定要删除这个评价吗？')) {
        try {
            const response = await apiRequest(`/api/admin/reviews/${id}`, {
                method: 'DELETE'
            });
            
            if (response.success) {
                alert('评价删除成功！');
                loadReviews(); // 重新加载数据
            } else {
                alert('删除失败：' + response.message);
            }
        } catch (error) {
            alert('删除失败：' + error.message);
        }
    }
} 

// 关闭模态框
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.remove();
    }
} 