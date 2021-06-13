import React, { useEffect, useState, useRef, useCallback } from "react";
import classNames from "classnames";

import { useLoading } from "../components/useLoading";
import { preventDefault } from "../utils/preventDefault";

const getRenderedPages = (totalPages) => {
  return Array(totalPages)
    .fill(0)
    .map((_, i) => i);
};

export const usePagination = ({ getPage, pageSize }) => {
  const [total, setTotal] = useState(0);
  const [result, setResult] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  useEffect(() => {
    if (currentPageIndex >= totalPages) {
      setCurrentPageIndex(totalPages - 1);
    }
  }, [totalPages]);

  const nextPage = preventDefault(() => {
    if (currentPageIndex >= totalPages - 1) {
      return;
    }

    setCurrentPageIndex(currentPageIndex + 1);
  });

  const prevPage = preventDefault(() => {
    if (currentPageIndex <= 0) {
      return;
    }

    setCurrentPageIndex(currentPageIndex - 1);
  });

  const setPage = preventDefault((i) => {
    if (i < 0 || i >= totalPages || i === currentPageIndex) {
      return;
    }

    setCurrentPageIndex(i);
  });

  const currentRequest = useRef(null);

  const retreivePage = (currentPageIndex) => {
    const request = getPage(currentPageIndex, pageSize);
    currentRequest.current = request;

    request.then(({ result, total }) => {
      setResult(result);
      setTotal(total);
    });

    return request;
  };

  const { isLoading, load: loadPage } = useLoading(retreivePage);

  useEffect(() => {
    const request = loadPage(currentPageIndex);

    return () => {
      request.cancel();
    };
  }, [currentPageIndex, getPage]);

  const reset = () => {
    if (currentRequest.current) {
      currentRequest.current.cancel();
      currentRequest.current = null;
    }

    if (currentPageIndex !== 0) {
      setCurrentPageIndex(0);
    } else {
      loadPage(0);
    }
  };

  const renderedPages = getRenderedPages(totalPages);

  const renderPage = (i) => {
    const isCurrent = i === currentPageIndex;

    return (
      <li key={i} className={classNames("page-item", { active: isCurrent })}>
        <a className="page-link" href="#" onClick={(e) => setPage(e, i)}>
          {(i + 1).toString(10)}
        </a>
      </li>
    );
  };

  const pagination =
    totalPages > 1 ? (
      <ul className="pagination">
        <li className="page-item">
          <a className="page-link" href="#" onClick={prevPage}>
            &laquo;
          </a>
        </li>
        {renderedPages.map(renderPage)}
        <li className="page-item">
          <a className="page-link" href="#" onClick={nextPage}>
            &raquo;
          </a>
        </li>
      </ul>
    ) : null;

  return { isLoading, pagination, result, reset };
};
