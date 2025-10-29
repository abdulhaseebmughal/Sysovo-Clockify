import api from "../config/api";

// ============ AUTHENTICATION ============
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/api/auth/logout");
    return response.data;
  },
};

// ============ EMPLOYEES ============
export const employeeAPI = {
  // Get all employees
  getAll: async () => {
    const response = await api.get("/api/auth/employees");
    return response.data;
  },

  // Get single employee by ID
  getById: async (id: string) => {
    const response = await api.get(`/api/auth/employee/${id}`);
    return response.data;
  },

  // Add new employee
  add: async (data: {
    name: string;
    email: string;
    password: string;
    subRole?: string;
  }) => {
    const response = await api.post("/api/auth/add", data);
    return response.data;
  },

  // Update employee
  update: async (
    id: string,
    data: { name?: string; email?: string; subRole?: string }
  ) => {
    const response = await api.put(`/api/auth/employee/${id}`, data);
    return response.data;
  },

  // Delete employee
  delete: async (id: string) => {
    const response = await api.delete(`/api/auth/employee/${id}`);
    return response.data;
  },

  // Get department statistics
  getDepartmentStats: async () => {
    const response = await api.get("/api/auth/department-stats");
    return response.data;
  },
};

// ============ ATTENDANCE ============
export const attendanceAPI = {
  // Punch in
  punchIn: async () => {
    const response = await api.post("/api/attendance/punchin");
    return response.data;
  },

  // Punch out
  punchOut: async () => {
    const response = await api.post("/api/attendance/punchout");
    return response.data;
  },

  // Get current session
  getCurrentSession: async () => {
    const response = await api.get("/api/attendance/current");
    return response.data;
  },

  // Get all attendance records
  getAll: async () => {
    const response = await api.get("/api/attendance/all");
    return response.data;
  },

  // Get attendance for specific user
  getUserAttendance: async (
    userId: string,
    params?: { startDate?: string; endDate?: string; limit?: number }
  ) => {
    const response = await api.get(`/api/attendance/user/${userId}`, {
      params,
    });
    return response.data;
  },

  // Get attendance statistics
  getStats: async (params?: {
    timeRange?: "daily" | "weekly" | "monthly";
    startDate?: string;
    endDate?: string;
  }) => {
    const response = await api.get("/api/attendance/stats", { params });
    return response.data;
  },

  // Get today's attendance
  getToday: async () => {
    const response = await api.get("/api/attendance/today");
    return response.data;
  },

  // Delete attendance record
  delete: async (id: string) => {
    const response = await api.delete(`/api/attendance/${id}`);
    return response.data;
  },
};

// ============ ANALYTICS ============
export const analyticsAPI = {
  // Get all employee analytics
  getAll: async (params?: { timeRange?: string; date?: string }) => {
    const response = await api.get("/api/analytics/all", { params });
    return response.data;
  },

  // Download PDF report
  downloadPDF: async (params?: { timeRange?: string; date?: string }) => {
    const response = await api.get("/api/analytics/download-pdf", {
      params,
      responseType: "blob",
    });
    return response.data;
  },
};

// ============ TASKS ============
export const taskAPI = {
  // Get all tasks (CEO view)
  getAll: async () => {
    const response = await api.get("/api/tasks/all");
    return response.data;
  },

  // Get my tasks (Employee view)
  getMyTasks: async () => {
    const response = await api.get("/api/tasks/my-tasks");
    return response.data;
  },

  // Add new task
  add: async (data: {
    title: string;
    assignedSubRole: string;
    assignedUser?: string;
    status?: string;
  }) => {
    const response = await api.post("/api/tasks/add", data);
    return response.data;
  },

  // Update task
  update: async (
    id: string,
    data: {
      title?: string;
      assignedSubRole?: string;
      assignedUser?: string;
      status?: string;
    }
  ) => {
    const response = await api.put(`/api/tasks/${id}`, data);
    return response.data;
  },

  // Update task status
  updateStatus: async (id: string, status: string) => {
    const response = await api.put(`/api/tasks/${id}/status`, { status });
    return response.data;
  },

  // Delete task
  delete: async (id: string) => {
    const response = await api.delete(`/api/tasks/${id}`);
    return response.data;
  },
};

// ============ BOARDS ============
export const boardAPI = {
  // Get all boards
  getAll: async () => {
    const response = await api.get("/api/boards");
    return response.data;
  },

  // Create board
  create: async (data: { name: string; description?: string }) => {
    const response = await api.post("/api/boards", data);
    return response.data;
  },

  // Add member to board
  addMember: async (boardId: string, userId: string) => {
    const response = await api.post("/api/boards/add-member", {
      boardId,
      userId,
    });
    return response.data;
  },

  // Delete board
  delete: async (id: string) => {
    const response = await api.delete(`/api/boards/${id}`);
    return response.data;
  },
};

// ============ LISTS ============
export const listAPI = {
  // Get lists by board
  getByBoard: async (boardId: string) => {
    const response = await api.get(`/api/lists/${boardId}`);
    return response.data;
  },

  // Create list
  create: async (data: { name: string; boardId: string }) => {
    const response = await api.post("/api/lists", data);
    return response.data;
  },

  // Update list
  update: async (id: string, data: { name: string }) => {
    const response = await api.put(`/api/lists/${id}`, data);
    return response.data;
  },

  // Delete list
  delete: async (id: string) => {
    const response = await api.delete(`/api/lists/${id}`);
    return response.data;
  },
};

// ============ CARDS ============
export const cardAPI = {
  // Get cards by list
  getByList: async (listId: string) => {
    const response = await api.get(`/api/cards/${listId}`);
    return response.data;
  },

  // Create card
  create: async (data: {
    title: string;
    listId: string;
    description?: string;
  }) => {
    const response = await api.post("/api/cards", data);
    return response.data;
  },

  // Update card
  update: async (
    id: string,
    data: { title?: string; description?: string; listId?: string }
  ) => {
    const response = await api.put(`/api/cards/${id}`, data);
    return response.data;
  },

  // Delete card
  delete: async (id: string) => {
    const response = await api.delete(`/api/cards/${id}`);
    return response.data;
  },
};

// Export all APIs as a single object
export default {
  auth: authAPI,
  employee: employeeAPI,
  attendance: attendanceAPI,
  analytics: analyticsAPI,
  task: taskAPI,
  board: boardAPI,
  list: listAPI,
  card: cardAPI,
};
