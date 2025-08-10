import GeneralDataTable from '$lib/components/common/GeneralDataTable.svelte';
import type { Meta, StoryObj } from '@storybook/sveltekit';
import SampleData from "./data/api-response.json"

const meta = {
  title: 'common/GeneralDataTable',
  component: GeneralDataTable,
  tags: ['autodocs'],
  argTypes: {
  },
} satisfies Meta<typeof GeneralDataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Simple: Story = {
  args: {
    items: createItems(2)
  },
};
export const Complex: Story = {
  args: {
    items: [
      {
        p1: [1, 2, 3],
        p2: {
          item1: {
            name: "aaa",
            item2: {
              name: "bbb"
            }
          }
        }
      }
    ]
  },
};

export const Large: Story = {
  args: {
    items: createItems(100)
  },
};
export const ApiResponseSample1: Story = {
  args: {
    items: SampleData
  },
};

function createItems(count: number) {
  const items = [];
  const names = ["SampleName", "TestName", "AnotherName"]
  for (let i = 0; i < count; i++) {
    items.push({
      name: names[Math.floor(i % names.length)] + i,
      age: Math.floor(i + 5),
      obj: {
        child1: "chiild1",
        child2: "chiild2"
      }
    });
  }
  return items;
}