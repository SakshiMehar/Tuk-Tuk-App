import API, { authRequestConfig } from "./axios";

/**
 * Fetch all available personality quizzes and their completion status.
 * GET /api/app/personality/quizzes
 */
export const getPersonalityQuizzes = async () => {
  const config = await authRequestConfig();
  const response = await API.get("/api/app/personality/quizzes", config);
  const data = response?.data?.data ?? response?.data;
  return Array.isArray(data) ? data : [];
};

/**
 * Fetch details & question list for a specific quiz.
 * GET /api/app/personality/quizzes/{quizId}
 */
export const getPersonalityQuizById = async (quizId) => {
  const config = await authRequestConfig();
  const response = await API.get(`/api/app/personality/quizzes/${quizId}`, config);
  return response?.data?.data ?? response?.data;
};

/**
 * Submit quiz answers and receive the calculated personality result.
 * POST /api/app/personality/quizzes/{quizId}/submit
 * Body: { answers: [{ questionId, optionId }] }
 */
export const submitPersonalityQuiz = async (quizId, answers) => {
  const config = await authRequestConfig();
  const response = await API.post(
    `/api/app/personality/quizzes/${quizId}/submit`,
    { answers },
    config
  );
  return response?.data?.data ?? response?.data;
};

/**
 * Fetch previously saved result for a completed quiz.
 * GET /api/app/personality/quizzes/result/{quizId}
 */
export const getPersonalityQuizResult = async (quizId) => {
  const config = await authRequestConfig();
  const response = await API.get(
    `/api/app/personality/quizzes/result/${quizId}`,
    config
  );
  return response?.data?.data ?? response?.data;
};
