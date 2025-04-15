import { Container } from '@/components';
import { ReactNode } from 'react';

export interface IToolbarProps {
  children?: ReactNode;
}

const Toolbar = ({ children }: IToolbarProps) => {
  return (
    <div className="pb-6">
      <Container className="flex items-center justify-between flex-wrap gap-3">
        {children}
      </Container>
    </div>
  );
};

export { Toolbar };
