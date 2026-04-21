'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { CreateUserForm } from './create-user-form';
import { CreateUserOverlays } from './create-user-overlays';
import { friends, groups, stakeOptions, topics, type Friend } from './create-user-helpers';
import styles from './page.module.css';

export default function CreateUserPage() {
  const router = useRouter();
  const [topicIndex, setTopicIndex] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [deadline, setDeadline] = useState('');
  const [search, setSearch] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [anonVote, setAnonVote] = useState(true);
  const [allowComment, setAllowComment] = useState(true);
  const [stakeEnabled, setStakeEnabled] = useState(false);
  const [selectedStakeIndex, setSelectedStakeIndex] = useState<number | null>(null);
  const [stakeCustom, setStakeCustom] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishStep, setPublishStep] = useState(-1);
  const [successOpen, setSuccessOpen] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!publishOpen) {
      setPublishStep(-1);
      return undefined;
    }

    const timers = [
      window.setTimeout(() => setPublishStep(0), 60),
      window.setTimeout(() => setPublishStep(1), 520),
      window.setTimeout(() => setPublishStep(2), selectedGroup ? 980 : 700),
      window.setTimeout(() => {
        setPublishOpen(false);
        setSuccessOpen(true);
      }, selectedGroup ? 1560 : 1280),
    ];

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [publishOpen, selectedGroup]);

  const filteredFriends = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return friends;
    }

    return friends.filter((item) => item.name.toLowerCase().includes(keyword));
  }, [search]);

  const selectedFriendItems = useMemo(
    () =>
      selectedFriends
        .map((id) => friends.find((friend) => friend.id === id))
        .filter(Boolean) as Friend[],
    [selectedFriends],
  );

  const selectedGroupItem = useMemo(
    () => groups.find((item) => item.id === selectedGroup) || null,
    [selectedGroup],
  );

  const stepStates = useMemo(
    () => [title.trim().length >= 3, optA.trim().length > 0 && optB.trim().length > 0, selectedFriends.length > 0],
    [optA, optB, selectedFriends.length, title],
  );

  const progress = Math.round((stepStates.filter(Boolean).length / 3) * 100);
  const previewVisible = optA.trim().length > 0 || optB.trim().length > 0;
  const stakeText = stakeCustom.trim() || (selectedStakeIndex === null ? '' : stakeOptions[selectedStakeIndex]);

  const toggleFriend = (id: string) => {
    setSelectedFriends((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const selectTopic = (index: number) => {
    const next = topicIndex === index ? null : index;
    setTopicIndex(next);
    if (next === null) {
      return;
    }

    const topic = topics[next];
    setTitle(topic.title);
    setOptA(topic.a);
    setOptB(topic.b);
  };

  const swapOptions = () => {
    setOptA(optB);
    setOptB(optA);
  };

  const toggleGroup = (id: string) => {
    setSelectedGroup((current) => (current === id ? null : id));
  };

  const toggleStake = () => {
    setStakeEnabled((current) => {
      const next = !current;
      if (!next) {
        setSelectedStakeIndex(null);
        setStakeCustom('');
      }
      return next;
    });
  };

  const selectStake = (index: number) => {
    if (selectedStakeIndex === index) {
      setSelectedStakeIndex(null);
      setStakeCustom('');
      return;
    }

    setSelectedStakeIndex(index);
    setStakeCustom(stakeOptions[index]);
  };

  const validateBeforePublish = () => {
    if (title.trim().length < 3) {
      setToast('⚠️ 标题至少3个字');
      return false;
    }

    if (!optA.trim() || !optB.trim()) {
      setToast('⚠️ 请填写两个PK选项');
      return false;
    }

    if (selectedFriends.length === 0) {
      setToast('⚠️ 至少邀请1位好友');
      return false;
    }

    return true;
  };

  const publishGuess = () => {
    if (!validateBeforePublish()) {
      return;
    }

    setPreviewOpen(false);
    setPublishOpen(true);
  };

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-arrow-left" />
        </button>
        <div className={styles.title}>发起好友竞猜</div>
        <button className={styles.ruleBtn} type="button" onClick={() => setToast('竞猜规则')}>
          <i className="fa-solid fa-circle-question" />
        </button>
      </header>

      <CreateUserForm
        topicIndex={topicIndex}
        title={title}
        desc={desc}
        optA={optA}
        optB={optB}
        deadline={deadline}
        search={search}
        filteredFriends={filteredFriends}
        selectedFriends={selectedFriends}
        selectedFriendItems={selectedFriendItems}
        selectedGroup={selectedGroup}
        anonVote={anonVote}
        allowComment={allowComment}
        stakeEnabled={stakeEnabled}
        selectedStakeIndex={selectedStakeIndex}
        stakeCustom={stakeCustom}
        stepStates={stepStates}
        progress={progress}
        previewVisible={previewVisible}
        onSelectTopic={selectTopic}
        onTitleChange={setTitle}
        onDescChange={setDesc}
        onOptionAChange={setOptA}
        onOptionBChange={setOptB}
        onSwapOptions={swapOptions}
        onSearchChange={setSearch}
        onToggleFriend={toggleFriend}
        onToggleGroup={toggleGroup}
        onDeadlineChange={setDeadline}
        onToggleAnonVote={() => setAnonVote((current) => !current)}
        onToggleAllowComment={() => setAllowComment((current) => !current)}
        onToggleStake={toggleStake}
        onSelectStake={selectStake}
        onStakeCustomChange={(value) => {
          setStakeCustom(value);
          if (value.trim()) {
            setSelectedStakeIndex(null);
          }
        }}
        onInviteMore={() => setToast('邀请更多好友')}
        onOpenPreview={() => setPreviewOpen(true)}
        onPublish={publishGuess}
      />

      <CreateUserOverlays
        previewOpen={previewOpen}
        publishOpen={publishOpen}
        publishStep={publishStep}
        successOpen={successOpen}
        toast={toast}
        title={title}
        desc={desc}
        optA={optA}
        optB={optB}
        deadline={deadline}
        selectedGroupItem={selectedGroupItem}
        selectedFriendItems={selectedFriendItems}
        selectedFriendsCount={selectedFriends.length}
        stakeEnabled={stakeEnabled}
        stakeText={stakeText}
        stepStates={stepStates}
        selectedGroup={selectedGroup}
        onClosePreview={() => setPreviewOpen(false)}
        onContinueEdit={() => setPreviewOpen(false)}
        onConfirmPublish={publishGuess}
        onCloseSuccess={() => setSuccessOpen(false)}
        onShareAction={(type) =>
          setToast(
            type === 'copy'
              ? '已复制链接'
              : type === 'wechat'
                ? '分享到微信'
                : type === 'friends'
                  ? '分享到猜友圈'
                  : '生成海报',
          )
        }
        onGoHome={() => router.push('/')}
      />
    </main>
  );
}
