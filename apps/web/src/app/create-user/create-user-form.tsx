'use client';

import styles from './page.module.css';
import { groups, stakeOptions, topics, type Friend, type Group } from './create-user-helpers';

type CreateUserFormProps = {
  topicIndex: number | null;
  title: string;
  desc: string;
  optA: string;
  optB: string;
  deadline: string;
  search: string;
  filteredFriends: Friend[];
  selectedFriends: string[];
  selectedFriendItems: Friend[];
  selectedGroup: string | null;
  anonVote: boolean;
  allowComment: boolean;
  stakeEnabled: boolean;
  selectedStakeIndex: number | null;
  stakeCustom: string;
  stepStates: boolean[];
  progress: number;
  previewVisible: boolean;
  onSelectTopic: (index: number) => void;
  onTitleChange: (value: string) => void;
  onDescChange: (value: string) => void;
  onOptionAChange: (value: string) => void;
  onOptionBChange: (value: string) => void;
  onSwapOptions: () => void;
  onSearchChange: (value: string) => void;
  onToggleFriend: (id: string) => void;
  onToggleGroup: (id: string) => void;
  onDeadlineChange: (value: string) => void;
  onToggleAnonVote: () => void;
  onToggleAllowComment: () => void;
  onToggleStake: () => void;
  onSelectStake: (index: number) => void;
  onStakeCustomChange: (value: string) => void;
  onInviteMore: () => void;
  onOpenPreview: () => void;
  onPublish: () => void;
};

export function CreateUserForm(props: CreateUserFormProps) {
  const {
    topicIndex,
    title,
    desc,
    optA,
    optB,
    deadline,
    search,
    filteredFriends,
    selectedFriends,
    selectedFriendItems,
    selectedGroup,
    anonVote,
    allowComment,
    stakeEnabled,
    selectedStakeIndex,
    stakeCustom,
    stepStates,
    progress,
    previewVisible,
    onSelectTopic,
    onTitleChange,
    onDescChange,
    onOptionAChange,
    onOptionBChange,
    onSwapOptions,
    onSearchChange,
    onToggleFriend,
    onToggleGroup,
    onDeadlineChange,
    onToggleAnonVote,
    onToggleAllowComment,
    onToggleStake,
    onSelectStake,
    onStakeCustomChange,
    onInviteMore,
    onOpenPreview,
    onPublish,
  } = props;

  return (
    <>
      <section className={styles.roleBar}>
        <span className={styles.roleIcon}>👤</span>
        <span className={styles.roleText}>用户端 · 好友PK模式</span>
        <span className={styles.roleDesc}>仅限社群和好友竞猜</span>
      </section>

      <section className={styles.progress}>
        <div className={styles.progressSegments}>
          {stepStates.map((done, index) => (
            <span key={`seg-${index}`} className={`${styles.progressSeg} ${done ? styles.progressSegDone : ''}`} />
          ))}
        </div>
        <div className={styles.progressInfo}>
          <span>竞猜完成度</span>
          <span className={styles.progressPct}>{progress}%</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionTitle}>
          <i className="fa-solid fa-fire" />
          选择话题
          <span>点击快速填充</span>
        </div>
        <div className={styles.topicRow}>
          {topics.map((item, index) => (
            <button
              key={item.name}
              className={`${styles.topicCard} ${topicIndex === index ? styles.topicCardActive : ''}`}
              type="button"
              onClick={() => onSelectTopic(index)}
            >
              <span className={styles.topicEmoji}>{item.emoji}</span>
              <span className={styles.topicName}>{item.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.form}>
        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-pen-nib" />
            竞猜内容
            <span className={styles.required}>*</span>
            <span className={`${styles.stepTag} ${stepStates[0] ? styles.stepTagDone : styles.stepTagPending}`}>
              {stepStates[0] ? '✓ 完成' : '待完善'}
            </span>
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.label}>
              <span>竞猜标题</span>
              <span className={styles.charCount}>{title.length}/40</span>
            </label>
            <input className={styles.input} value={title} maxLength={40} placeholder="例：今晚吃什么？" onChange={(event) => onTitleChange(event.target.value)} />
          </div>
          <div className={styles.fieldBlock}>
            <label className={styles.label}>补充说明（选填）</label>
            <textarea className={styles.textarea} value={desc} placeholder="输入竞猜详情或规则..." onChange={(event) => onDescChange(event.target.value)} />
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-bolt" />
            PK选项
            <span className={styles.required}>*</span>
            <span className={`${styles.stepTag} ${stepStates[1] ? styles.stepTagDone : styles.stepTagPending}`}>
              {stepStates[1] ? '✓ 完成' : '待完善'}
            </span>
          </div>
          <div className={styles.vsWrap}>
            <div className={styles.vsRow}>
              <input className={`${styles.optionInput} ${styles.optionA}`} value={optA} placeholder="选项 A" onChange={(event) => onOptionAChange(event.target.value)} />
              <div className={styles.vsBadge}>VS</div>
              <input className={`${styles.optionInput} ${styles.optionB}`} value={optB} placeholder="选项 B" onChange={(event) => onOptionBChange(event.target.value)} />
            </div>
            <button className={styles.swapBtn} type="button" onClick={onSwapOptions}>
              <i className="fa-solid fa-arrow-right-arrow-left" />
              交换选项
            </button>
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-user-group" />
            邀请好友参战
            <span className={styles.required}>*</span>
            <span className={`${styles.stepTag} ${stepStates[2] ? styles.stepTagDone : styles.stepTagPending}`}>
              {stepStates[2] ? `✓ ${selectedFriends.length}人` : '待完善'}
            </span>
          </div>
          <div className={styles.friendHeader}>
            <span className={styles.friendCount}>已选 {selectedFriends.length} 人</span>
          </div>
          <div className={styles.search}>
            <i className="fa-solid fa-magnifying-glass" />
            <input value={search} placeholder="搜索好友..." onChange={(event) => onSearchChange(event.target.value)} />
          </div>
          <div className={styles.friendGrid}>
            {filteredFriends.map((friend) => {
              const active = selectedFriends.includes(friend.id);
              return (
                <button
                  key={friend.id}
                  className={`${styles.friendCard} ${active ? styles.friendCardActive : ''}`}
                  type="button"
                  onClick={() => onToggleFriend(friend.id)}
                >
                  <span className={styles.friendCheck}>
                    <i className="fa-solid fa-check" />
                  </span>
                  <span className={`${styles.friendOnline} ${friend.status === 'online' ? styles.online : styles.offline}`} />
                  <img className={styles.friendAvatar} src={friend.avatar} alt={friend.name} />
                  <span className={styles.friendName}>{friend.name.slice(0, 4)}</span>
                  <span className={styles.friendWinrate}>胜率{friend.winrate}%</span>
                </button>
              );
            })}
            <button className={styles.inviteMore} type="button" onClick={onInviteMore}>
              <span className={styles.inviteMoreIcon}>
                <i className="fa-solid fa-plus" />
              </span>
              <span className={styles.inviteMoreText}>邀请</span>
            </button>
          </div>
          {selectedFriendItems.length > 0 ? (
            <div className={styles.selectedTags}>
              {selectedFriendItems.map((friend) => (
                <span key={friend.id} className={styles.selectedTag}>
                  <img src={friend.avatar} alt={friend.name} />
                  {friend.name.slice(0, 4)}
                  <button type="button" onClick={() => onToggleFriend(friend.id)}>
                    <i className="fa-solid fa-xmark" />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-people-group" />
            发布到社群
            <span className={styles.optional}>（选填）</span>
          </div>
          <div className={styles.groupList}>
            {groups.map((group) => {
              const active = selectedGroup === group.id;
              return (
                <button
                  key={group.id}
                  className={`${styles.groupCard} ${active ? styles.groupCardActive : ''}`}
                  type="button"
                  onClick={() => onToggleGroup(group.id)}
                >
                  <span className={styles.groupAvatar} style={{ backgroundColor: group.bg }}>
                    {group.initials}
                  </span>
                  <div className={styles.groupInfo}>
                    <div className={styles.groupName}>{group.name}</div>
                    <div className={styles.groupMeta}>{group.members}人 · {group.desc}</div>
                  </div>
                  <span className={styles.groupCheck}>
                    <i className="fa-solid fa-check" />
                  </span>
                </button>
              );
            })}
          </div>
        </article>

        <article className={styles.card}>
          <div className={styles.cardTitle}>
            <i className="fa-solid fa-gear" />
            竞猜设置
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>截止时间</div>
              <div className={styles.settingDesc}>到时间自动开奖</div>
            </div>
            <input className={`${styles.input} ${styles.deadline}`} type="datetime-local" value={deadline} onChange={(event) => onDeadlineChange(event.target.value)} />
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>匿名投票</div>
              <div className={styles.settingDesc}>好友看不到彼此选择</div>
            </div>
            <button className={`${styles.toggle} ${anonVote ? styles.toggleOn : ''}`} type="button" onClick={onToggleAnonVote}>
              <span />
            </button>
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>允许评论</div>
              <div className={styles.settingDesc}>好友可以发表看法</div>
            </div>
            <button className={`${styles.toggle} ${allowComment ? styles.toggleOn : ''}`} type="button" onClick={onToggleAllowComment}>
              <span />
            </button>
          </div>
          <div className={styles.settingRow}>
            <div>
              <div className={styles.settingLabel}>赌注加码 🎲</div>
              <div className={styles.settingDesc}>输的人请客/发红包</div>
            </div>
            <button className={`${styles.toggle} ${stakeEnabled ? styles.toggleOn : ''}`} type="button" onClick={onToggleStake}>
              <span />
            </button>
          </div>
          {stakeEnabled ? (
            <div className={styles.stakeArea}>
              <div className={styles.stakeQuick}>
                {stakeOptions.map((item, index) => (
                  <button
                    key={item}
                    className={`${styles.stakeChip} ${selectedStakeIndex === index ? styles.stakeChipActive : ''}`}
                    type="button"
                    onClick={() => onSelectStake(index)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <input
                className={`${styles.input} ${styles.stakeInput}`}
                value={stakeCustom}
                placeholder="自定义赌注内容..."
                maxLength={30}
                onChange={(event) => onStakeCustomChange(event.target.value)}
              />
            </div>
          ) : null}
        </article>
      </section>

      {previewVisible ? (
        <div className={styles.previewBar}>
          <div className={styles.previewVs}>
            <span className={styles.previewA}>{optA.trim() || '--'}</span>
            <span className={styles.previewBadge}>VS</span>
            <span className={styles.previewB}>{optB.trim() || '--'}</span>
          </div>
          <div className={styles.previewFriends}>{selectedFriends.length}人参战</div>
        </div>
      ) : null}

      <div className={styles.bottomBar}>
        <button className={styles.secondaryBtn} type="button" onClick={onOpenPreview}>
          预览
        </button>
        <button className={styles.primaryBtn} type="button" onClick={onPublish}>
          <i className="fa-solid fa-paper-plane" />
          发起竞猜
        </button>
      </div>
    </>
  );
}
