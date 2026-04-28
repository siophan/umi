'use client';

import { useRouter } from 'next/navigation';

import { CreateBasicInfoSection } from './create-basic-info-section';
import { CreateOverlays } from './create-overlays';
import { CreateOptionsSection } from './create-options-section';
import { CreatePkSection } from './create-pk-section';
import { CreateSettingsSection } from './create-settings-section';
import { CreateSkeleton } from './create-skeleton';
import { templates } from './create-helpers';
import { useCreatePageState } from './use-create-page-state';
import styles from './page.module.css';

/**
 * 创建竞猜页暂时仍是老系统形态对齐页。
 * 这里优先还原旧页面结构和节奏，不在这一轮扩展真实发布链路。
 */
export default function CreatePage() {
  const router = useRouter();
  const {
    titleInputRef,
    coverInputRef,
    isMerchantMode,
    template,
    selectTemplate,
    title,
    setTitle,
    desc,
    setDesc,
    deadline,
    setDeadline,
    revealAt,
    setRevealAt,
    minParticipants,
    setMinParticipants,
    options,
    selectedFriends,
    friendKeyword,
    setFriendKeyword,
    selectedProduct,
    productPickerOpen,
    setPreviewOpen,
    productKeyword,
    setProductKeyword,
    tempProductId,
    setTempProductId,
    productSort,
    setProductSort,
    sortDropdownOpen,
    setSortDropdownOpen,
    previewOpen,
    publishing,
    publishStep,
    successOpen,
    setSuccessOpen,
    toast,
    titleTipVisible,
    titleInputError,
    selectedTopic,
    coverPreviewUrl,
    coverUploading,
    coverUploaded,
    authReady,
    guessCategoryItems,
    guessCategoriesLoadFailed,
    selectedGuessCategoryId,
    setSelectedGuessCategoryId,
    publishDisabled,
    steps,
    progress,
    selectedCount,
    filteredFriends,
    selectedFriendList,
    productItems,
    productTotal,
    productLoading,
    productLoadingMore,
    productHasMore,
    productCategoryItems,
    productCategoryId,
    setProductCategoryId,
    tempProduct,
    sortLabel,
    visibleTopics,
    updateOption,
    addOption,
    removeOption,
    toggleFriend,
    showToast,
    confirmProductPick,
    refreshTopics,
    pickTopic,
    copyInviteLink,
    shareVia,
    openProductPicker,
    closeProductPicker,
    handleCoverPick,
    handlePublish,
    loadMoreProducts,
  } = useCreatePageState();

  if (!authReady) {
    return <CreateSkeleton />;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} type="button" onClick={() => router.back()}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <div className={styles.headerTitle}>创建竞猜</div>
        <div className={styles.headerAction} />
      </header>

      <div className={`${styles.roleBar} ${isMerchantMode ? styles.merchantMode : styles.userMode}`}>
        <span className={styles.roleIcon}>{isMerchantMode ? '🏪' : '👤'}</span>
        <span className={styles.roleText}>{isMerchantMode ? '店铺模式' : '用户模式'}</span>
        <span className={`${styles.roleBadge} ${!isMerchantMode ? styles.roleBadgeHidden : ''}`}>PRO</span>
        <span className={styles.roleDesc}>{isMerchantMode ? '全功能创建模式' : '仅限好友PK竞猜'}</span>
      </div>

      <div className={styles.formProgress}>
        <div className={styles.progressBar}>
          {steps.map((step, index) => (
            <div key={index} className={`${styles.progressSeg} ${step ? styles.progressSegDone : ''}`} />
          ))}
        </div>
        <div className={styles.progressInfo}>
          <span>创建进度</span>
          <span className={styles.progressPct}>{progress}%</span>
        </div>
      </div>

      <div className={styles.sectionHeader}>选择竞猜模板</div>
      <div className={styles.templateGrid}>
        {templates.map((item) => {
          const locked = item.merchantOnly && !isMerchantMode;
          const comingSoon = Boolean(item.comingSoon);
          const disabled = locked || comingSoon;
          const maskText = locked ? '🔒 开店解锁' : comingSoon ? '🚧 暂未上线' : '';
          return (
            <button
              key={item.id}
              type="button"
              className={`${styles.templateCard} ${template === item.id ? styles.templateSelected : ''} ${disabled ? styles.templateLocked : ''}`}
              onClick={() => {
                if (comingSoon) {
                  showToast(`${item.name} 暂未上线`);
                  return;
                }
                if (!locked) {
                  selectTemplate(item.id);
                  showToast(`${item.name} 模板`);
                }
              }}
            >
              <div className={styles.templateIcon}>{item.icon}</div>
              <div className={styles.templateName}>{item.name}</div>
              <div className={styles.templateDesc}>{item.desc}</div>
              {disabled ? <div className={styles.templateMask}>{maskText}</div> : null}
            </button>
          );
        })}
      </div>

      {!isMerchantMode ? (
        <button className={styles.merchantHook} type="button" onClick={() => router.push('/my-shop')}>
          <div className={styles.merchantHookIcon}>🏪</div>
          <div className={styles.merchantHookInfo}>
            <div className={styles.merchantHookTitle}>想要发布更多竞猜玩法？</div>
            <div className={styles.merchantHookDesc}>开通店铺身份，解锁二选一、多选、数值预测等全模板和店铺竞猜设置</div>
          </div>
          <i className={`fa-solid fa-chevron-right ${styles.merchantHookArrow}`} />
        </button>
      ) : null}

      <div className={styles.dividerThick} />

      <CreateBasicInfoSection
        stepDone={steps[1]}
        titleInputRef={titleInputRef}
        title={title}
        setTitle={setTitle}
        visibleTopics={visibleTopics}
        selectedTopic={selectedTopic}
        pickTopic={pickTopic}
        refreshTopics={refreshTopics}
        titleTipVisible={titleTipVisible}
        titleInputError={titleInputError}
        desc={desc}
        setDesc={setDesc}
        coverInputRef={coverInputRef}
        coverPreviewUrl={coverPreviewUrl}
        coverUploading={coverUploading}
        coverUploaded={coverUploaded}
        handleCoverPick={handleCoverPick}
        isMerchantMode={isMerchantMode}
        guessCategoryItems={guessCategoryItems}
        guessCategoriesLoadFailed={guessCategoriesLoadFailed}
        selectedGuessCategoryId={selectedGuessCategoryId}
        setSelectedGuessCategoryId={setSelectedGuessCategoryId}
      />

      <div className={styles.dividerThick} />

      <CreateOptionsSection
        template={template}
        stepDone={steps[2]}
        selectedCount={selectedCount}
        options={options}
        updateOption={updateOption}
        removeOption={removeOption}
        addOption={addOption}
      />

      {!isMerchantMode && (template === 'pk_duo' || template === 'pk_multi') ? (
        <>
          <div className={styles.dividerThick} />
          <CreatePkSection
            template={template}
            selectedFriends={selectedFriends}
            friendKeyword={friendKeyword}
            setFriendKeyword={setFriendKeyword}
            filteredFriends={filteredFriends}
            selectedFriendList={selectedFriendList}
            toggleFriend={toggleFriend}
            showToast={showToast}
          />
        </>
      ) : null}

      <div className={styles.dividerThick} />

      <CreateSettingsSection
        stepDone={steps[3]}
        deadline={deadline}
        setDeadline={setDeadline}
        revealAt={revealAt}
        setRevealAt={setRevealAt}
        minParticipants={minParticipants}
        setMinParticipants={setMinParticipants}
        isMerchantMode={isMerchantMode}
        openProductPicker={openProductPicker}
        selectedProduct={selectedProduct}
      />

      <div className={styles.bottomBar}>
        <button className={styles.previewBtn} type="button" onClick={() => setPreviewOpen(true)}>
          预览
        </button>
        <button
          className={styles.publishBtn}
          type="button"
          onClick={handlePublish}
          disabled={publishDisabled}
        >
          {publishDisabled ? '分类加载失败，无法发布' : '发布竞猜'}
        </button>
      </div>

      <CreateOverlays
        previewOpen={previewOpen}
        setPreviewOpen={setPreviewOpen}
        template={template}
        title={title}
        desc={desc}
        deadline={deadline}
        selectedProduct={selectedProduct}
        options={options}
        handlePublish={handlePublish}
        productPickerOpen={productPickerOpen}
        closeProductPicker={closeProductPicker}
        productKeyword={productKeyword}
        setProductKeyword={setProductKeyword}
        productCategoryItems={productCategoryItems}
        productCategoryId={productCategoryId}
        setProductCategoryId={setProductCategoryId}
        sortDropdownOpen={sortDropdownOpen}
        setSortDropdownOpen={setSortDropdownOpen}
        sortLabel={sortLabel}
        productSort={productSort}
        setProductSort={setProductSort}
        productItems={productItems}
        productTotalCount={productTotal}
        productLoading={productLoading}
        productLoadingMore={productLoadingMore}
        productHasMore={productHasMore}
        loadMoreProducts={loadMoreProducts}
        tempProduct={tempProduct}
        tempProductId={tempProductId}
        setTempProductId={setTempProductId}
        confirmProductPick={confirmProductPick}
        copyInviteLink={copyInviteLink}
        shareVia={shareVia}
        publishing={publishing}
        publishStep={publishStep}
        successOpen={successOpen}
        setSuccessOpen={setSuccessOpen}
        routerPushHome={() => router.push('/')}
      />

      <div className={`${styles.toast} ${toast ? styles.toastShow : ''}`}>{toast}</div>
    </main>
  );
}
