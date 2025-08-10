import GeneralJsonCard from '$lib/components/common/GeneralJsonCard.svelte';
import { CardType } from '$lib/utils/utils';
import type { Meta, StoryObj } from '@storybook/sveltekit';

const meta = {
  title: 'common/GeneralJsonCard',
  component: GeneralJsonCard,
  tags: ['autodocs'],
  argTypes: {
    data:{
      control: {
        type: 'object',
      },
    },
    title:{
      control: {
        type: 'text',
      },
    },
    open:{
      control: {
        type: 'boolean'
      }
    },
    type:{
      control: {
        type: 'select',
        options: [CardType.NORMAL, CardType.ERROR, CardType.WARNING],
      },
    }
  },
} satisfies Meta<GeneralJsonCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = {
  args: {
    data: {
      name: 'Sample Name',
      age: 30,
    },
    title: 'Sample Card',
  },
};

export const Error: Story = {
  args: {
    data: {
      name: 'Sample Name',
      age: 30,
    },
    title: 'Sample Card',
    type: CardType.ERROR,
  },
};


export const Warning: Story = {
  args: {
    data: {
      name: 'Sample Name',
      age: 30,
    },
    title: 'Sample Card',
    type: CardType.WARNING,
  },
};

export const Opend: Story = {
  args: {
    data: {
      name: 'Sample Name',
      age: 30,
    },
    open: true,
    title: 'Sample Card',
  },
};
