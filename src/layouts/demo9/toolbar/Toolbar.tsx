import { ReactNode } from 'react';
import { Container } from '@/components';

export interface IToolbarProps {
  children?: ReactNode;
}

const Toolbar = ({ children }: IToolbarProps) => {
  return (
    <div className="mb-5 lg:mb-7.5">
      <Container className="flex items-center justify-between flex-wrap gap-5">
        {children}
      </Container>
    </div>
  );
};

export { Toolbar };
