function getPagination({ page = 1, limit = 20 }) {
  const currentPage = Math.max(Number(page) || 1, 1)
  const perPage = Math.min(Math.max(Number(limit) || 20, 1), 100)

  return {
    currentPage,
    perPage,
    skip: (currentPage - 1) * perPage,
  }
}

function getPaginationMeta({ total, currentPage, perPage }) {
  const totalPages = Math.ceil(total / perPage)

  return {
    page: currentPage,
    limit: perPage,
    total,
    totalPages,
  }
}

module.exports = {
  getPagination,
  getPaginationMeta,
}
