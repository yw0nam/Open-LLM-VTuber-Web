/* eslint-disable function-paren-newline */
/* eslint-disable react/jsx-one-expression-per-line */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/order */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react/require-default-props */
import React from "react";
import { Box, Spinner, Flex, Text, Icon } from "@chakra-ui/react";
import { sidebarStyles, chatPanelStyles } from "./sidebar-styles";
import {
  MainContainer,
  ChatContainer,
  MessageList as ChatMessageList,
  Message as ChatMessage,
  Avatar as ChatAvatar,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { useChatHistory } from "@/context/chat-history-context";
import { Global } from "@emotion/react";
import { useConfig } from "@/context/character-config-context";
import { FaTools, FaCheck } from "react-icons/fa";
import { useTranslation } from "react-i18next";

// Main component
function ChatHistoryPanel(): JSX.Element {
  const { t } = useTranslation();
  const { messages } = useChatHistory(); // Get messages directly from context
  const { confName } = useConfig();
  const userName = "Me";

  // All messages are valid - we handle rendering based on role and content
  const validMessages = messages;

  return (
    <Box h="full" overflow="hidden" bg="gray.900">
      <Global styles={chatPanelStyles} />
      <MainContainer>
        <ChatContainer>
          <ChatMessageList>
            {validMessages.length === 0 ? (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                height="100%"
                color="whiteAlpha.500"
                fontSize="sm"
              >
                {t("sidebar.noMessages")}
              </Box>
            ) : (
              validMessages.map((msg) => {
                // Handle tool message type - display tool results
                if (msg.role === "tool") {
                  return (
                    <Flex
                      key={msg.id}
                      {...sidebarStyles.toolCallIndicator.container}
                      alignItems="center"
                    >
                      <Icon
                        as={FaCheck}
                        {...sidebarStyles.toolCallIndicator.completedIcon}
                      />
                      <Text {...sidebarStyles.toolCallIndicator.text}>
                        {msg.name
                          ? `Tool ${msg.name} completed`
                          : "Tool completed"}
                      </Text>
                    </Flex>
                  );
                }

                // Handle assistant messages with tool_calls
                if (msg.role === "assistant" && msg.tool_calls && msg.tool_calls.length > 0) {
                  return (
                    <React.Fragment key={msg.id}>
                      {/* Render tool call indicators */}
                      {msg.tool_calls.map((toolCall, idx) => (
                        <Flex
                          key={`${msg.id}-tool-${idx}`}
                          {...sidebarStyles.toolCallIndicator.container}
                          alignItems="center"
                        >
                          <Icon
                            as={FaTools}
                            {...sidebarStyles.toolCallIndicator.icon}
                          />
                          <Text {...sidebarStyles.toolCallIndicator.text}>
                            {`Calling tool: ${toolCall.name}`}
                          </Text>
                          <Spinner
                            size="xs"
                            color={sidebarStyles.toolCallIndicator.spinner.color}
                            ml={sidebarStyles.toolCallIndicator.spinner.ml}
                          />
                        </Flex>
                      ))}
                      {/* If assistant message has content along with tool calls, render it */}
                      {msg.content && (
                        <ChatMessage
                          key={`${msg.id}-content`}
                          model={{
                            message: msg.content,
                            sentTime: msg.timestamp,
                            sender: confName || "AI",
                            direction: "incoming",
                            position: "single",
                          }}
                          avatarPosition="tl"
                          avatarSpacer={false}
                        >
                          <ChatAvatar>
                            {confName ? confName[0].toUpperCase() : "A"}
                          </ChatAvatar>
                        </ChatMessage>
                      )}
                    </React.Fragment>
                  );
                }

                // Render standard chat messages (user or assistant without tool calls)
                return (
                  <ChatMessage
                    key={msg.id}
                    model={{
                      message: msg.content,
                      sentTime: msg.timestamp,
                      sender:
                        msg.role === "assistant"
                          ? confName || "AI"
                          : userName,
                      direction: msg.role === "assistant" ? "incoming" : "outgoing",
                      position: "single",
                    }}
                    avatarPosition={msg.role === "assistant" ? "tl" : "tr"}
                    avatarSpacer={false}
                  >
                    <ChatAvatar>
                      {msg.role === "assistant"
                        ? (confName && confName[0].toUpperCase()) || "A"
                        : userName[0].toUpperCase()}
                    </ChatAvatar>
                  </ChatMessage>
                );
              })
            )}
          </ChatMessageList>
        </ChatContainer>
      </MainContainer>
    </Box>
  );
}

export default ChatHistoryPanel;
