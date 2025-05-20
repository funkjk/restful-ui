import Short from '$lib/components/common/Short.svelte';
import type { Meta, StoryObj } from '@storybook/svelte';

const meta = {
  title: 'common/Short',
  component: Short,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: {
        type: 'object',
      },
    },
    length: {
      control: {
        type: 'number', 
      }
    }
  },
} satisfies Meta<Short>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StringText: Story = {
  args: {
    value: "Hover to curosor on this text. Then tooltip show the full text.",
    length: 40,
  },
};

export const ArrayText: Story = {
  args: {
    value: ["Sample Text","Array Text","Another Sample Text"],
    length: 40,
  },
};

export const ObjectText: Story = {
  args: {
    value: {
      name: "Sample Name",
      age: 30,},
    length: 40,
  },
};
export const ObjectArray: Story = {
  args: {
    value: [{
      name: "Sample Name1",
      age: 30,},{
      name: "Sample Name2",
      age: 30,}],
    length: 40,
  },
};