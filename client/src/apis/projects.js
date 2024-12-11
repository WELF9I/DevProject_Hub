import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

/**
 * 
 * @description get all projects from  the database
 */
export const getProjects = async () => {
  const response = await axios.get(`${API_URL}/api/projects`)
  return response.data
}

/**
 * @description get top projects by their engagements(stars,forks,watchers)
 */
export const getTopProjects = async () => {
  const response = await axios.get(`${API_URL}/api/projects/top-projects`)
  return response.data
}

export const createProject = async (projectData) => {
  const response = await axios.post(`${API_URL}/api/projects`, projectData)
  return response.data
}

/**
 * 
 @description bookmark a project for that user
 */
export const bookmarkProject = async (clerkId, projectId) => {
  const response = await axios.post(`${API_URL}/api/bookmarks`, { clerk_id: clerkId, project_id: projectId })
  return response.data
}

export const removeBookmark = async (clerkId, projectId) => {
  const response = await axios.delete(`${API_URL}/api/bookmarks`, { data: { clerk_id: clerkId, project_id: projectId } })
  return response.data
}

/**
 * 
 @description get all the bookmarked projects for that user
 */
export const getBookmarks = async (clerkId) => {
  const response = await axios.get(`${API_URL}/api/bookmarks/${clerkId}`)
  return response.data
}

/**
 * @description check if the project is bookmarked or not
 */

export const checkProjectBookmark = async (clerkId, projectId) => {
  try {
    const response = await axios.get(`${API_URL}/api/bookmarks/check`, { 
      params: { 
        clerk_id: clerkId, 
        project_id: projectId 
      },
        withCredentials: true
    });
    return response.data.isBookmarked;
  } catch (error) {
    throw error;
  }
};

/**
 * @description add the specific project visited by that user to history
 */

export const addToHistory = async (clerkId, projectId) => {
  const response = await axios.post(`${API_URL}/api/history/add/${clerkId}/${projectId}`)
  return response.data
}
export const getHistory = async (clerkId) => {
  const response = await axios.get(`${API_URL}/api/history/${clerkId}`)
  return response.data
}

export const deleteAllUserHistory = async (clerkId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/history/${clerkId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

export const deleteSpecificProjectFromHistory = async (clerkId, projectId) => {
  try {
    const response = await axios.delete(`${API_URL}/api/history/${clerkId}/${projectId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 *@description get tags engagement which is the sum of engagements(stars,forks,watchers) for each tag
 */

export const getTagsEngagement = async () => {
  const response = await axios.get(`${API_URL}/api/charts/tags-engagement`)
  return response.data
}

