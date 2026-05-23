/**
 * Standard API success response
 */
function successResponse(data, message = 'Success') {
  return { success: true, message, data };
}

/**
 * Standard API paginated response
 */
function paginatedResponse(data, { total, page, limit }, message = 'Success') {
  return {
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    },
  };
}

/**
 * Standard API error response
 */
function errorResponse(message = 'An error occurred', errors = null) {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return response;
}

module.exports = { successResponse, paginatedResponse, errorResponse };
