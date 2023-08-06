import { createStyles, Stack, Text } from "@mantine/core";

export const TooltipContent = (props: {
  mainTooltip: string;
  secondaryTooltip?: string;
  showMainTooltip?: boolean;
}) => {
  const { classes } = createStyles({ root: {} })(undefined, {
    name: "Tooltip",
  });
  if (!props.secondaryTooltip) {
    return null;
  }
  return (
    <Stack spacing={0} className={classes.root}>
      {props.showMainTooltip ? (
        <Text size={"sm"}>{props.mainTooltip}</Text>
      ) : null}
      {props.secondaryTooltip && (
        <Text size={"xs"}>{props.secondaryTooltip}</Text>
      )}
    </Stack>
  );
};
