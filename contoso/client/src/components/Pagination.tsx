import { Pagination as BSPagination } from 'react-bootstrap';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const items = [];
  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  // First page
  if (startPage > 1) {
    items.push(
      <BSPagination.First key='first' onClick={() => onPageChange(1)} />
    );
  }

  // Previous page
  items.push(
    <BSPagination.Prev
      key='prev'
      disabled={currentPage === 1}
      onClick={() => onPageChange(currentPage - 1)}
    />
  );

  // Page numbers
  for (let page = startPage; page <= endPage; page++) {
    items.push(
      <BSPagination.Item
        key={page}
        active={page === currentPage}
        onClick={() => onPageChange(page)}
      >
        {page}
      </BSPagination.Item>
    );
  }

  // Next page
  items.push(
    <BSPagination.Next
      key='next'
      disabled={currentPage === totalPages}
      onClick={() => onPageChange(currentPage + 1)}
    />
  );

  // Last page
  if (endPage < totalPages) {
    items.push(
      <BSPagination.Last key='last' onClick={() => onPageChange(totalPages)} />
    );
  }

  return (
    <div className='d-flex justify-content-center'>
      <BSPagination>{items}</BSPagination>
    </div>
  );
};
