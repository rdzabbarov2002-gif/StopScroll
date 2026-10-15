import { View } from "react-native";

import type { AiQuestion } from "../../ai/types";
import { useAi } from "../../context/AiContext";
import { haptics } from "../../utils/haptics";
import { useThemeColors } from "../../utils/theme";
import { AppText } from "../AppText";
import { Card } from "../Card";
import { CardLabel } from "../CardLabel";
import { Chip } from "../Chip";
import { Button } from "../Button";

/** An occasional question from the coach — only when the answer helps the analysis. */
export function QuestionCard({ question }: { question: AiQuestion }) {
  const { colors } = useThemeColors();
  const ai = useAi();
  return (
    <Card className="gap-3">
      <CardLabel icon="help-buoy" label="Вопрос для точности" color={colors.indigo} />
      <AppText variant="statement">{question.text}</AppText>
      <View className="flex-row flex-wrap gap-2">
        {question.options.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={false}
            onPress={() => {
              haptics.selection();
              ai.answerQuestion(option);
            }}
          />
        ))}
      </View>
      <Button label="Пропустить" variant="ghost" onPress={ai.dismissQuestion} />
    </Card>
  );
}
