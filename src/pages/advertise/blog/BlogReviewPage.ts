import React from 'react';
import BasicTemplate from './components/BasicTemplate';

const BlogReviewPage = () => {
  return React.createElement(BasicTemplate, {
    title: "블로그 리뷰",
    description: "서비스 > 블로그 리뷰"
  });
};

export { BlogReviewPage };
